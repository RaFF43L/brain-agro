import { IsCpfOrCnpjConstraint } from '../is-cpf-or-cnpj.validator';

describe('IsCpfOrCnpjConstraint', () => {
  const validator = new IsCpfOrCnpjConstraint();

  describe('CPF', () => {
    it('should accept a valid CPF', () => {
      expect(validator.validate('52998224725')).toBe(true);
    });

    it('should accept a valid CPF with mask', () => {
      expect(validator.validate('529.982.247-25')).toBe(true);
    });

    it('should reject a CPF with all same digits', () => {
      expect(validator.validate('11111111111')).toBe(false);
    });

    it('should reject a CPF with invalid check digits', () => {
      expect(validator.validate('52998224700')).toBe(false);
    });

    it('should reject a CPF with wrong length', () => {
      expect(validator.validate('1234567')).toBe(false);
    });
  });

  describe('CNPJ', () => {
    it('should accept a valid CNPJ', () => {
      expect(validator.validate('11222333000181')).toBe(true);
    });

    it('should accept a valid CNPJ with mask', () => {
      expect(validator.validate('11.222.333/0001-81')).toBe(true);
    });

    it('should reject a CNPJ with all same digits', () => {
      expect(validator.validate('11111111111111')).toBe(false);
    });

    it('should reject a CNPJ with invalid check digits', () => {
      expect(validator.validate('11222333000100')).toBe(false);
    });
  });

  describe('invalid inputs', () => {
    it('should reject non-string values', () => {
      expect(validator.validate(123 as any)).toBe(false);
      expect(validator.validate(null as any)).toBe(false);
      expect(validator.validate(undefined as any)).toBe(false);
    });

    it('should reject empty string', () => {
      expect(validator.validate('')).toBe(false);
    });
  });
});
