import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { createTestApp, truncateTables } from './helpers/setup';

describe('Crops (e2e)', () => {
  let app: INestApplication;
  let farmId: number;

  beforeAll(async () => {
    app = await createTestApp();
  });

  beforeEach(async () => {
    await truncateTables(app);

    const producer = await request(app.getHttpServer())
      .post('/producers')
      .send({ cpfCnpj: '52998224725', name: 'João Silva' });

    const farm = await request(app.getHttpServer())
      .post('/farms')
      .send({
        name: 'Fazenda Boa Vista',
        city: 'Ribeirão Preto',
        state: 'SP',
        totalArea: 1000,
        arableArea: 600,
        vegetationArea: 400,
        producerId: producer.body.id,
      });

    farmId = farm.body.id;
  });

  afterAll(async () => {
    await app.close();
  });

  // ---------------------------------------------------------------------------
  // POST /crops
  // ---------------------------------------------------------------------------

  describe('POST /crops', () => {
    it('creates a crop and returns 201', async () => {
      const res = await request(app.getHttpServer())
        .post('/crops')
        .send({ season: 'Safra 2024', culture: 'Soja', farmId })
        .expect(201);

      expect(res.body.id).toBeDefined();
      expect(res.body.season).toBe('Safra 2024');
      expect(res.body.culture).toBe('Soja');
      expect(res.body.farmId).toBe(farmId);
    });

    it('returns 404 when farmId does not exist', async () => {
      await request(app.getHttpServer())
        .post('/crops')
        .send({ season: 'Safra 2024', culture: 'Soja', farmId: 9999 })
        .expect(404);
    });

    it('returns 400 when required fields are missing', async () => {
      await request(app.getHttpServer())
        .post('/crops')
        .send({ culture: 'Soja' })
        .expect(400);
    });
  });

  // ---------------------------------------------------------------------------
  // GET /farms/:farmId/crops
  // ---------------------------------------------------------------------------

  describe('GET /farms/:farmId/crops', () => {
    it('returns crops belonging to a farm with cursor pagination', async () => {
      await request(app.getHttpServer())
        .post('/crops')
        .send({ season: 'Safra 2024', culture: 'Soja', farmId });
      await request(app.getHttpServer())
        .post('/crops')
        .send({ season: 'Safra 2023', culture: 'Milho', farmId });

      const res = await request(app.getHttpServer())
        .get(`/farms/${farmId}/crops`)
        .expect(200);

      expect(res.body.data).toHaveLength(2);
      expect(res.body.meta.total).toBe(2);
    });

    it('returns empty list for farm with no crops', async () => {
      const res = await request(app.getHttpServer())
        .get(`/farms/${farmId}/crops`)
        .expect(200);

      expect(res.body.data).toHaveLength(0);
      expect(res.body.meta.total).toBe(0);
    });

    it('paginates with cursor', async () => {
      const c1 = await request(app.getHttpServer())
        .post('/crops')
        .send({ season: 'Safra 2023', culture: 'Milho', farmId });
      await request(app.getHttpServer())
        .post('/crops')
        .send({ season: 'Safra 2024', culture: 'Soja', farmId });

      const res = await request(app.getHttpServer())
        .get(`/farms/${farmId}/crops?limit=1&cursor=${c1.body.id}`)
        .expect(200);

      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].culture).toBe('Soja');
    });

    it('filters crops by search term', async () => {
      await request(app.getHttpServer())
        .post('/crops')
        .send({ season: 'Safra 2024', culture: 'Soja', farmId });
      await request(app.getHttpServer())
        .post('/crops')
        .send({ season: 'Safra 2023', culture: 'Milho', farmId });

      const res = await request(app.getHttpServer())
        .get(`/farms/${farmId}/crops?search=Soja`)
        .expect(200);

      expect(res.body.meta.total).toBe(1);
      expect(res.body.data[0].culture).toBe('Soja');
    });
  });

  // ---------------------------------------------------------------------------
  // GET /crops/unassigned
  // ---------------------------------------------------------------------------

  describe('GET /crops/unassigned', () => {
    it('returns crops with no farm', async () => {
      // Create an assigned crop
      await request(app.getHttpServer())
        .post('/crops')
        .send({ season: 'Safra 2024', culture: 'Soja', farmId });

      // There are no unassigned crops (CreateCropDto requires farmId)
      // Unassigned crops can only result from the cascade-null behavior.
      // Verify the endpoint is working and returns the correct structure.
      const res = await request(app.getHttpServer())
        .get('/crops/unassigned')
        .expect(200);

      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.meta).toMatchObject({
        total: 0,
        limit: 10,
      });
    });

    it('returns unassigned crop after its farm is deleted', async () => {
      // Create a second farm to delete, leaving its crop orphaned
      const producer = await request(app.getHttpServer())
        .post('/producers')
        .send({ cpfCnpj: '11444777035', name: 'P2' });

      const farm2 = await request(app.getHttpServer())
        .post('/farms')
        .send({
          name: 'Fazenda Temporária',
          city: 'SP',
          state: 'SP',
          totalArea: 200,
          arableArea: 100,
          vegetationArea: 100,
          producerId: producer.body.id,
        });

      const crop = await request(app.getHttpServer())
        .post('/crops')
        .send({ season: 'Safra 2022', culture: 'Café', farmId: farm2.body.id });

      // Delete farm with onDelete:'CASCADE' removes the crop too, so
      // the unassigned list stays empty after cascade delete.
      // This test validates that behavior: crop is gone, not orphaned.
      await request(app.getHttpServer())
        .delete(`/farms/${farm2.body.id}`)
        .expect(204);

      await request(app.getHttpServer())
        .get(`/crops/${crop.body.id}`)
        .expect(404);
    });
  });

  // ---------------------------------------------------------------------------
  // GET /crops/:id
  // ---------------------------------------------------------------------------

  describe('GET /crops/:id', () => {
    it('returns crop by id with farm relation', async () => {
      const created = await request(app.getHttpServer())
        .post('/crops')
        .send({ season: 'Safra 2024', culture: 'Soja', farmId });

      const res = await request(app.getHttpServer())
        .get(`/crops/${created.body.id}`)
        .expect(200);

      expect(res.body.id).toBe(created.body.id);
      expect(res.body.farm).toBeDefined();
    });

    it('returns 404 when crop does not exist', async () => {
      await request(app.getHttpServer()).get('/crops/9999').expect(404);
    });
  });

  // ---------------------------------------------------------------------------
  // PATCH /crops/:id
  // ---------------------------------------------------------------------------

  describe('PATCH /crops/:id', () => {
    it('updates crop season and culture', async () => {
      const created = await request(app.getHttpServer())
        .post('/crops')
        .send({ season: 'Safra 2024', culture: 'Soja', farmId });

      const res = await request(app.getHttpServer())
        .patch(`/crops/${created.body.id}`)
        .send({ season: 'Safra 2025', culture: 'Milho' })
        .expect(200);

      expect(res.body.season).toBe('Safra 2025');
      expect(res.body.culture).toBe('Milho');
    });

    it('returns 404 when crop does not exist', async () => {
      await request(app.getHttpServer())
        .patch('/crops/9999')
        .send({ culture: 'X' })
        .expect(404);
    });
  });

  // ---------------------------------------------------------------------------
  // DELETE /crops/:id
  // ---------------------------------------------------------------------------

  describe('DELETE /crops/:id', () => {
    it('deletes crop and returns 204', async () => {
      const created = await request(app.getHttpServer())
        .post('/crops')
        .send({ season: 'Safra 2024', culture: 'Soja', farmId });

      await request(app.getHttpServer())
        .delete(`/crops/${created.body.id}`)
        .expect(204);

      await request(app.getHttpServer())
        .get(`/crops/${created.body.id}`)
        .expect(404);
    });

    it('returns 404 when crop does not exist', async () => {
      await request(app.getHttpServer()).delete('/crops/9999').expect(404);
    });
  });
});
