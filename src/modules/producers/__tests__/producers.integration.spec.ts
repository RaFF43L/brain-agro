import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { createTestApp, truncateTables } from '../../../common/test/setup';

describe('Producers (integration)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  beforeEach(async () => {
    await truncateTables(app);
  });

  afterAll(async () => {
    await app.close();
  });

  // ---------------------------------------------------------------------------
  // POST /producers
  // ---------------------------------------------------------------------------

  describe('POST /producers', () => {
    it('creates a producer and returns 201', async () => {
      const res = await request(app.getHttpServer())
        .post('/producers')
        .send({ cpfCnpj: '52998224725', name: 'João Silva' })
        .expect(201);

      expect(res.body).toMatchObject({ cpfCnpj: '52998224725', name: 'João Silva' });
      expect(res.body.id).toBeDefined();
    });

    it('returns 400 for invalid CPF/CNPJ', async () => {
      await request(app.getHttpServer())
        .post('/producers')
        .send({ cpfCnpj: '00000000000', name: 'Invalid' })
        .expect(400);
    });

    it('returns 400 when name is missing', async () => {
      await request(app.getHttpServer())
        .post('/producers')
        .send({ cpfCnpj: '52998224725' })
        .expect(400);
    });
  });

  // ---------------------------------------------------------------------------
  // POST /producers/full
  // ---------------------------------------------------------------------------

  describe('POST /producers/full', () => {
    it('creates producer with nested farms and crops', async () => {
      const res = await request(app.getHttpServer())
        .post('/producers/full')
        .send({
          cpfCnpj: '52998224725',
          name: 'João Silva',
          farms: [
            {
              name: 'Fazenda Boa Vista',
              city: 'Ribeirão Preto',
              state: 'SP',
              totalArea: 1000,
              arableArea: 600,
              vegetationArea: 400,
              crops: [{ season: 'Safra 2024', culture: 'Soja' }],
            },
          ],
        })
        .expect(201);

      expect(res.body.id).toBeDefined();
      expect(res.body.farms).toHaveLength(1);
      expect(res.body.farms[0].crops).toHaveLength(1);
      expect(res.body.farms[0].crops[0].culture).toBe('Soja');
    });

    it('creates producer without farms', async () => {
      const res = await request(app.getHttpServer())
        .post('/producers/full')
        .send({ cpfCnpj: '52998224725', name: 'Maria Santos' })
        .expect(201);

      expect(res.body.farms).toEqual([]);
    });
  });

  // ---------------------------------------------------------------------------
  // GET /producers
  // ---------------------------------------------------------------------------

  describe('GET /producers', () => {
    it('returns paginated list with meta', async () => {
      await request(app.getHttpServer())
        .post('/producers')
        .send({ cpfCnpj: '52998224725', name: 'João Silva' });

      const res = await request(app.getHttpServer()).get('/producers').expect(200);

      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.meta).toMatchObject({
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
        hasNext: false,
      });
    });

    it('filters by search term', async () => {
      await request(app.getHttpServer())
        .post('/producers')
        .send({ cpfCnpj: '52998224725', name: 'João Silva' });
      await request(app.getHttpServer())
        .post('/producers')
        .send({ cpfCnpj: '11144477735', name: 'Maria Santos' });

      const res = await request(app.getHttpServer())
        .get('/producers?search=Maria')
        .expect(200);

      expect(res.body.meta.total).toBe(1);
      expect(res.body.data[0].name).toBe('Maria Santos');
    });

    it('respects limit and page', async () => {
      await request(app.getHttpServer())
        .post('/producers')
        .send({ cpfCnpj: '52998224725', name: 'Produtor A' });
      await request(app.getHttpServer())
        .post('/producers')
        .send({ cpfCnpj: '11144477735', name: 'Produtor B' });

      const res = await request(app.getHttpServer())
        .get('/producers?limit=1&page=1')
        .expect(200);

      expect(res.body.data).toHaveLength(1);
      expect(res.body.meta.totalPages).toBe(2);
      expect(res.body.meta.hasNext).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // GET /producers/:id
  // ---------------------------------------------------------------------------

  describe('GET /producers/:id', () => {
    it('returns producer by id', async () => {
      const created = await request(app.getHttpServer())
        .post('/producers')
        .send({ cpfCnpj: '52998224725', name: 'João Silva' });

      const res = await request(app.getHttpServer())
        .get(`/producers/${created.body.id}`)
        .expect(200);

      expect(res.body.id).toBe(created.body.id);
      expect(res.body.name).toBe('João Silva');
    });

    it('returns 404 when producer does not exist', async () => {
      await request(app.getHttpServer()).get('/producers/9999').expect(404);
    });
  });

  // ---------------------------------------------------------------------------
  // PATCH /producers/:id
  // ---------------------------------------------------------------------------

  describe('PATCH /producers/:id', () => {
    it('updates producer name', async () => {
      const created = await request(app.getHttpServer())
        .post('/producers')
        .send({ cpfCnpj: '52998224725', name: 'João Silva' });

      const res = await request(app.getHttpServer())
        .patch(`/producers/${created.body.id}`)
        .send({ name: 'João Atualizado' })
        .expect(200);

      expect(res.body.name).toBe('João Atualizado');
      expect(res.body.cpfCnpj).toBe('52998224725');
    });

    it('returns 404 when producer does not exist', async () => {
      await request(app.getHttpServer())
        .patch('/producers/9999')
        .send({ name: 'X' })
        .expect(404);
    });
  });

  // ---------------------------------------------------------------------------
  // DELETE /producers/:id
  // ---------------------------------------------------------------------------

  describe('DELETE /producers/:id', () => {
    it('deletes producer and returns 204', async () => {
      const created = await request(app.getHttpServer())
        .post('/producers')
        .send({ cpfCnpj: '52998224725', name: 'João Silva' });

      await request(app.getHttpServer())
        .delete(`/producers/${created.body.id}`)
        .expect(204);

      await request(app.getHttpServer())
        .get(`/producers/${created.body.id}`)
        .expect(404);
    });

    it('cascade deletes farms and crops when producer is deleted', async () => {
      const producer = await request(app.getHttpServer())
        .post('/producers/full')
        .send({
          cpfCnpj: '52998224725',
          name: 'João Silva',
          farms: [
            {
              name: 'Fazenda Teste',
              city: 'SP',
              state: 'SP',
              totalArea: 500,
              arableArea: 300,
              vegetationArea: 200,
              crops: [{ season: 'Safra 2024', culture: 'Milho' }],
            },
          ],
        });

      const farmId = producer.body.farms[0].id;
      const cropId = producer.body.farms[0].crops[0].id;

      await request(app.getHttpServer())
        .delete(`/producers/${producer.body.id}`)
        .expect(204);

      await request(app.getHttpServer()).get(`/farms/${farmId}`).expect(404);
      await request(app.getHttpServer()).get(`/crops/${cropId}`).expect(404);
    });
  });
});
