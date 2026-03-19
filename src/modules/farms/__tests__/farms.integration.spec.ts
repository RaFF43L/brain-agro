import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { createTestApp, truncateTables } from '../../../common/test/setup';

describe('Farms (integration)', () => {
  let app: INestApplication;
  let producerId: number;

  beforeAll(async () => {
    app = await createTestApp();
  });

  beforeEach(async () => {
    await truncateTables(app);

    const res = await request(app.getHttpServer())
      .post('/producers')
      .send({ cpfCnpj: '52998224725', name: 'João Silva' });
    producerId = res.body.id;
  });

  afterAll(async () => {
    await app.close();
  });

  const farmPayload = () => ({
    name: 'Fazenda Boa Vista',
    city: 'Ribeirão Preto',
    state: 'SP',
    totalArea: 1000,
    arableArea: 600,
    vegetationArea: 400,
    producerId,
  });

  // ---------------------------------------------------------------------------
  // POST /farms
  // ---------------------------------------------------------------------------

  describe('POST /farms', () => {
    it('creates a farm and returns 201', async () => {
      const res = await request(app.getHttpServer())
        .post('/farms')
        .send(farmPayload())
        .expect(201);

      expect(res.body.id).toBeDefined();
      expect(res.body.name).toBe('Fazenda Boa Vista');
      expect(res.body.producerId).toBe(producerId);
    });

    it('returns 422 when arableArea + vegetationArea exceed totalArea', async () => {
      await request(app.getHttpServer())
        .post('/farms')
        .send({ ...farmPayload(), arableArea: 700, vegetationArea: 400 })
        .expect(422);
    });

    it('returns 404 when producerId does not exist', async () => {
      await request(app.getHttpServer())
        .post('/farms')
        .send({ ...farmPayload(), producerId: 9999 })
        .expect(404);
    });

    it('returns 400 when required fields are missing', async () => {
      await request(app.getHttpServer())
        .post('/farms')
        .send({ name: 'Incompleta' })
        .expect(400);
    });
  });

  // ---------------------------------------------------------------------------
  // GET /producers/:producerId/farms
  // ---------------------------------------------------------------------------

  describe('GET /producers/:producerId/farms', () => {
    it('returns farms belonging to a producer with cursor pagination', async () => {
      await request(app.getHttpServer()).post('/farms').send(farmPayload());
      await request(app.getHttpServer())
        .post('/farms')
        .send({ ...farmPayload(), name: 'Fazenda 2' });

      const res = await request(app.getHttpServer())
        .get(`/producers/${producerId}/farms`)
        .expect(200);

      expect(res.body.data).toHaveLength(2);
      expect(res.body.meta.total).toBe(2);
    });

    it('returns empty list for producer with no farms', async () => {
      const other = await request(app.getHttpServer())
        .post('/producers')
        .send({ cpfCnpj: '11444777035', name: 'Outro' });

      const res = await request(app.getHttpServer())
        .get(`/producers/${other.body.id}/farms`)
        .expect(200);

      expect(res.body.data).toHaveLength(0);
      expect(res.body.meta.total).toBe(0);
    });

    it('paginates with cursor', async () => {
      const f1 = await request(app.getHttpServer())
        .post('/farms')
        .send(farmPayload());
      await request(app.getHttpServer())
        .post('/farms')
        .send({ ...farmPayload(), name: 'Fazenda 2' });

      const res = await request(app.getHttpServer())
        .get(`/producers/${producerId}/farms?limit=1&cursor=${f1.body.id}`)
        .expect(200);

      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].name).toBe('Fazenda 2');
    });
  });

  // ---------------------------------------------------------------------------
  // GET /farms/unassigned
  // ---------------------------------------------------------------------------

  describe('GET /farms/unassigned', () => {
    it('returns empty list when all farms have a producer', async () => {
      await request(app.getHttpServer()).post('/farms').send(farmPayload());

      const res = await request(app.getHttpServer())
        .get('/farms/unassigned')
        .expect(200);

      expect(res.body.data).toHaveLength(0);
      expect(res.body.meta.total).toBe(0);
    });
  });

  // ---------------------------------------------------------------------------
  // GET /farms/dashboard
  // ---------------------------------------------------------------------------

  describe('GET /farms/dashboard', () => {
    it('returns dashboard with totals', async () => {
      await request(app.getHttpServer()).post('/farms').send(farmPayload());

      const res = await request(app.getHttpServer())
        .get('/farms/dashboard')
        .expect(200);

      expect(res.body).toMatchObject({
        totalFarms: 1,
        totalHectares: 1000,
        byState: expect.any(Array),
        byCulture: expect.any(Array),
        landUse: { arableArea: 600, vegetationArea: 400 },
      });
    });

    it('filters dashboard by date range', async () => {
      await request(app.getHttpServer()).post('/farms').send(farmPayload());

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const res = await request(app.getHttpServer())
        .get(
          `/farms/dashboard?initialDate=2000-01-01&finalDate=${tomorrow.toISOString().split('T')[0]}`,
        )
        .expect(200);

      expect(res.body.totalFarms).toBe(1);
    });

    it('returns zeroed dashboard when date range excludes all farms', async () => {
      await request(app.getHttpServer()).post('/farms').send(farmPayload());

      const res = await request(app.getHttpServer())
        .get('/farms/dashboard?initialDate=2000-01-01&finalDate=2000-01-02')
        .expect(200);

      expect(res.body.totalFarms).toBe(0);
      expect(res.body.totalHectares).toBe(0);
    });
  });

  // ---------------------------------------------------------------------------
  // GET /farms/:id
  // ---------------------------------------------------------------------------

  describe('GET /farms/:id', () => {
    it('returns farm by id with producer and crops relations', async () => {
      const created = await request(app.getHttpServer())
        .post('/farms')
        .send(farmPayload());

      const res = await request(app.getHttpServer())
        .get(`/farms/${created.body.id}`)
        .expect(200);

      expect(res.body.id).toBe(created.body.id);
      expect(res.body.producer).toBeDefined();
      expect(res.body.crops).toBeInstanceOf(Array);
    });

    it('returns 404 when farm does not exist', async () => {
      await request(app.getHttpServer()).get('/farms/9999').expect(404);
    });
  });

  // ---------------------------------------------------------------------------
  // PATCH /farms/:id
  // ---------------------------------------------------------------------------

  describe('PATCH /farms/:id', () => {
    it('updates farm name and city', async () => {
      const created = await request(app.getHttpServer())
        .post('/farms')
        .send(farmPayload());

      const res = await request(app.getHttpServer())
        .patch(`/farms/${created.body.id}`)
        .send({ name: 'Fazenda Nova', city: 'Campinas' })
        .expect(200);

      expect(res.body.name).toBe('Fazenda Nova');
      expect(res.body.city).toBe('Campinas');
    });

    it('returns 422 when updated areas exceed total', async () => {
      const created = await request(app.getHttpServer())
        .post('/farms')
        .send(farmPayload());

      await request(app.getHttpServer())
        .patch(`/farms/${created.body.id}`)
        .send({ arableArea: 900, vegetationArea: 200 })
        .expect(422);
    });

    it('returns 404 when farm does not exist', async () => {
      await request(app.getHttpServer())
        .patch('/farms/9999')
        .send({ name: 'X' })
        .expect(404);
    });
  });

  // ---------------------------------------------------------------------------
  // DELETE /farms/:id
  // ---------------------------------------------------------------------------

  describe('DELETE /farms/:id', () => {
    it('deletes farm and returns 204', async () => {
      const created = await request(app.getHttpServer())
        .post('/farms')
        .send(farmPayload());

      await request(app.getHttpServer())
        .delete(`/farms/${created.body.id}`)
        .expect(204);

      await request(app.getHttpServer())
        .get(`/farms/${created.body.id}`)
        .expect(404);
    });

    it('cascade deletes crops when farm is deleted', async () => {
      const farm = await request(app.getHttpServer())
        .post('/farms')
        .send(farmPayload());

      const crop = await request(app.getHttpServer())
        .post('/crops')
        .send({ season: 'Safra 2024', culture: 'Soja', farmId: farm.body.id });

      await request(app.getHttpServer())
        .delete(`/farms/${farm.body.id}`)
        .expect(204);

      await request(app.getHttpServer())
        .get(`/crops/${crop.body.id}`)
        .expect(404);
    });
  });
});
