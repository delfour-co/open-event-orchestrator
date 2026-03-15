import { ClientResponseError } from 'pocketbase'
import { describe, expect, it } from 'vitest'
import { handleNoMatchError, handleNotFoundError, isNotFoundError } from './pocketbase-errors'

describe('pocketbase-errors', () => {
  describe('isNotFoundError', () => {
    it('should return true for a 404 ClientResponseError', () => {
      const error = new ClientResponseError({ status: 404 })
      expect(isNotFoundError(error)).toBe(true)
    })

    it('should return false for a non-404 ClientResponseError', () => {
      const error = new ClientResponseError({ status: 400 })
      expect(isNotFoundError(error)).toBe(false)
    })

    it('should return false for a 500 ClientResponseError', () => {
      const error = new ClientResponseError({ status: 500 })
      expect(isNotFoundError(error)).toBe(false)
    })

    it('should return false for a plain Error', () => {
      const error = new Error('something went wrong')
      expect(isNotFoundError(error)).toBe(false)
    })

    it('should return false for a string', () => {
      expect(isNotFoundError('not found')).toBe(false)
    })

    it('should return false for null', () => {
      expect(isNotFoundError(null)).toBe(false)
    })

    it('should return false for undefined', () => {
      expect(isNotFoundError(undefined)).toBe(false)
    })

    it('should return false for a number', () => {
      expect(isNotFoundError(404)).toBe(false)
    })
  })

  describe('handleNotFoundError', () => {
    it('should return null for a 404 ClientResponseError', () => {
      const error = new ClientResponseError({ status: 404 })
      expect(handleNotFoundError(error)).toBeNull()
    })

    it('should throw for a non-404 ClientResponseError', () => {
      const error = new ClientResponseError({ status: 400 })
      expect(() => handleNotFoundError(error)).toThrow(error)
    })

    it('should throw for a plain Error', () => {
      const error = new Error('network failure')
      expect(() => handleNotFoundError(error)).toThrow(error)
    })

    it('should throw for a string error', () => {
      expect(() => handleNotFoundError('error')).toThrow()
    })
  })

  describe('handleNoMatchError', () => {
    it('should be the same function as handleNotFoundError', () => {
      expect(handleNoMatchError).toBe(handleNotFoundError)
    })

    it('should return null for a 404 ClientResponseError', () => {
      const error = new ClientResponseError({ status: 404 })
      expect(handleNoMatchError(error)).toBeNull()
    })

    it('should throw for a non-404 ClientResponseError', () => {
      const error = new ClientResponseError({ status: 500 })
      expect(() => handleNoMatchError(error)).toThrow(error)
    })
  })
})
