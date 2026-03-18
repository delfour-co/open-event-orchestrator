import type PocketBase from 'pocketbase'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createSimulationScenarioRepository } from './simulation-scenario-repository'

vi.mock('$lib/server/safe-filter', () => ({
  safeFilter: (strings: TemplateStringsArray, ...values: string[]) =>
    strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), '')
}))

const createMockPb = () => {
  const mockCollection = vi.fn()
  return {
    collection: mockCollection,
    _mockCollection: mockCollection
  }
}

const makeScenarioRecord = (overrides: Record<string, unknown> = {}) => ({
  id: 'scen1',
  editionId: 'edition1',
  name: 'Optimistic Scenario',
  description: 'Best case',
  parameters: JSON.stringify({
    expectedAttendees: 500,
    ticketPrice: 100,
    sponsorshipTarget: 20000,
    fixedCosts: [{ name: 'Venue', amount: 5000 }],
    variableCostsPerAttendee: [{ name: 'Catering', amount: 30 }]
  }),
  results: null,
  isBaseline: false,
  createdBy: 'user1',
  created: '2024-01-01T00:00:00Z',
  updated: '2024-01-02T00:00:00Z',
  ...overrides
})

describe('SimulationScenarioRepository', () => {
  let mockPb: ReturnType<typeof createMockPb>

  beforeEach(() => {
    mockPb = createMockPb()
  })

  describe('findByEdition', () => {
    it('should return scenarios for an edition', async () => {
      const records = [makeScenarioRecord()]
      const mockGetFullList = vi.fn().mockResolvedValue(records)
      mockPb._mockCollection.mockReturnValue({ getFullList: mockGetFullList })

      const repo = createSimulationScenarioRepository(mockPb as unknown as PocketBase)
      const result = await repo.findByEdition('edition1')

      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('Optimistic Scenario')
      expect(result[0].parameters.expectedAttendees).toBe(500)
    })
  })

  describe('findById', () => {
    it('should return scenario by id', async () => {
      const record = makeScenarioRecord()
      const mockGetOne = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ getOne: mockGetOne })

      const repo = createSimulationScenarioRepository(mockPb as unknown as PocketBase)
      const result = await repo.findById('scen1')

      expect(result?.parameters.ticketPrice).toBe(100)
    })

    it('should return null when not found', async () => {
      const mockGetOne = vi.fn().mockRejectedValue(new Error('not found'))
      mockPb._mockCollection.mockReturnValue({ getOne: mockGetOne })

      const repo = createSimulationScenarioRepository(mockPb as unknown as PocketBase)
      const result = await repo.findById('nonexistent')

      expect(result).toBeNull()
    })

    it('should handle parameters as object (not string)', async () => {
      const record = makeScenarioRecord({
        parameters: {
          expectedAttendees: 200,
          ticketPrice: 50,
          sponsorshipTarget: 10000,
          fixedCosts: [],
          variableCostsPerAttendee: []
        }
      })
      const mockGetOne = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ getOne: mockGetOne })

      const repo = createSimulationScenarioRepository(mockPb as unknown as PocketBase)
      const result = await repo.findById('scen1')

      expect(result?.parameters.expectedAttendees).toBe(200)
    })
  })

  describe('findBaseline', () => {
    it('should return baseline scenario for an edition', async () => {
      const record = makeScenarioRecord({ isBaseline: true })
      const mockGetFirstListItem = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ getFirstListItem: mockGetFirstListItem })

      const repo = createSimulationScenarioRepository(mockPb as unknown as PocketBase)
      const result = await repo.findBaseline('edition1')

      expect(result?.isBaseline).toBe(true)
    })

    it('should return null when no baseline exists', async () => {
      const mockGetFirstListItem = vi.fn().mockRejectedValue(new Error('not found'))
      mockPb._mockCollection.mockReturnValue({ getFirstListItem: mockGetFirstListItem })

      const repo = createSimulationScenarioRepository(mockPb as unknown as PocketBase)
      const result = await repo.findBaseline('edition1')

      expect(result).toBeNull()
    })
  })

  describe('create', () => {
    it('should create a scenario', async () => {
      const record = makeScenarioRecord()
      const mockCreate = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ create: mockCreate })

      const repo = createSimulationScenarioRepository(mockPb as unknown as PocketBase)
      const result = await repo.create({
        editionId: 'edition1',
        name: 'Optimistic Scenario',
        isBaseline: false,
        parameters: {
          expectedAttendees: 500,
          ticketPrice: 100,
          sponsorshipTarget: 20000,
          fixedCosts: [],
          variableCostsPerAttendee: []
        },
        createdBy: 'user1'
      })

      expect(result.name).toBe('Optimistic Scenario')
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          editionId: 'edition1',
          results: null,
          isBaseline: false
        })
      )
    })
  })

  describe('update', () => {
    it('should update only provided fields', async () => {
      const record = makeScenarioRecord({ name: 'Updated Scenario' })
      const mockUpdate = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ update: mockUpdate })

      const repo = createSimulationScenarioRepository(mockPb as unknown as PocketBase)
      const result = await repo.update('scen1', { name: 'Updated Scenario' })

      expect(result.name).toBe('Updated Scenario')
    })
  })

  describe('updateResults', () => {
    it('should update simulation results', async () => {
      const results = {
        totalRevenue: 70000,
        ticketRevenue: 50000,
        sponsorshipRevenue: 20000,
        totalCosts: 35000,
        fixedCostsTotal: 5000,
        variableCostsTotal: 30000,
        netProfit: 35000,
        breakEvenAttendees: 250,
        breakEvenTicketPrice: 70,
        profitMargin: 50
      }
      const record = makeScenarioRecord({ results: JSON.stringify(results) })
      const mockUpdate = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ update: mockUpdate })

      const repo = createSimulationScenarioRepository(mockPb as unknown as PocketBase)
      await repo.updateResults('scen1', results)

      expect(mockUpdate).toHaveBeenCalledWith('scen1', {
        results: JSON.stringify(results)
      })
    })
  })

  describe('setAsBaseline', () => {
    it('should unset existing baseline and set new one', async () => {
      const existingBaseline = [{ id: 'scen_old' }]
      const mockGetFullList = vi.fn().mockResolvedValue(existingBaseline)
      const mockUpdate = vi.fn().mockResolvedValue({})
      mockPb._mockCollection.mockReturnValue({ getFullList: mockGetFullList, update: mockUpdate })

      const repo = createSimulationScenarioRepository(mockPb as unknown as PocketBase)
      await repo.setAsBaseline('edition1', 'scen1')

      expect(mockUpdate).toHaveBeenCalledWith('scen_old', { isBaseline: false })
      expect(mockUpdate).toHaveBeenCalledWith('scen1', { isBaseline: true })
    })

    it('should handle case with no existing baseline', async () => {
      const mockGetFullList = vi.fn().mockResolvedValue([])
      const mockUpdate = vi.fn().mockResolvedValue({})
      mockPb._mockCollection.mockReturnValue({ getFullList: mockGetFullList, update: mockUpdate })

      const repo = createSimulationScenarioRepository(mockPb as unknown as PocketBase)
      await repo.setAsBaseline('edition1', 'scen1')

      expect(mockUpdate).toHaveBeenCalledTimes(1)
      expect(mockUpdate).toHaveBeenCalledWith('scen1', { isBaseline: true })
    })
  })

  describe('delete', () => {
    it('should delete a scenario by id', async () => {
      const mockDelete = vi.fn().mockResolvedValue(undefined)
      mockPb._mockCollection.mockReturnValue({ delete: mockDelete })

      const repo = createSimulationScenarioRepository(mockPb as unknown as PocketBase)
      await repo.delete('scen1')

      expect(mockDelete).toHaveBeenCalledWith('scen1')
    })
  })

  describe('countByEdition', () => {
    it('should return count of scenarios for an edition', async () => {
      const mockGetList = vi.fn().mockResolvedValue({ totalItems: 4 })
      mockPb._mockCollection.mockReturnValue({ getList: mockGetList })

      const repo = createSimulationScenarioRepository(mockPb as unknown as PocketBase)
      const result = await repo.countByEdition('edition1')

      expect(result).toBe(4)
    })
  })
})
