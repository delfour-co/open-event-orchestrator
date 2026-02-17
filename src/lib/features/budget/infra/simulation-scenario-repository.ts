import { safeFilter } from '$lib/server/safe-filter'
import type PocketBase from 'pocketbase'
import type {
  CreateSimulationScenario,
  SimulationParameters,
  SimulationResults,
  SimulationScenario,
  UpdateSimulationScenario
} from '../domain'

const COLLECTION = 'simulation_scenarios'

const buildUpdateData = (data: UpdateSimulationScenario): Record<string, unknown> => {
  const updateData: Record<string, unknown> = {}
  if (data.name !== undefined) updateData.name = data.name
  if (data.description !== undefined) updateData.description = data.description || null
  if (data.parameters !== undefined) updateData.parameters = JSON.stringify(data.parameters)
  if (data.isBaseline !== undefined) updateData.isBaseline = data.isBaseline
  return updateData
}

export const createSimulationScenarioRepository = (pb: PocketBase) => ({
  async findByEdition(editionId: string): Promise<SimulationScenario[]> {
    const records = await pb.collection(COLLECTION).getFullList({
      filter: safeFilter`editionId = ${editionId}`,
      sort: '-isBaseline,-created'
    })
    return records.map(mapRecordToScenario)
  },

  async findById(id: string): Promise<SimulationScenario | null> {
    try {
      const record = await pb.collection(COLLECTION).getOne(id)
      return mapRecordToScenario(record)
    } catch {
      return null
    }
  },

  async findBaseline(editionId: string): Promise<SimulationScenario | null> {
    try {
      const record = await pb
        .collection(COLLECTION)
        .getFirstListItem(safeFilter`editionId = ${editionId} && isBaseline = ${true}`)
      return mapRecordToScenario(record)
    } catch {
      return null
    }
  },

  async create(data: CreateSimulationScenario): Promise<SimulationScenario> {
    const record = await pb.collection(COLLECTION).create({
      editionId: data.editionId,
      name: data.name,
      description: data.description || null,
      parameters: JSON.stringify(data.parameters),
      results: null,
      isBaseline: data.isBaseline || false,
      createdBy: data.createdBy
    })
    return mapRecordToScenario(record)
  },

  async update(id: string, data: UpdateSimulationScenario): Promise<SimulationScenario> {
    const record = await pb.collection(COLLECTION).update(id, buildUpdateData(data))
    return mapRecordToScenario(record)
  },

  async updateResults(id: string, results: SimulationResults): Promise<SimulationScenario> {
    const record = await pb.collection(COLLECTION).update(id, {
      results: JSON.stringify(results)
    })
    return mapRecordToScenario(record)
  },

  async setAsBaseline(editionId: string, scenarioId: string): Promise<void> {
    // First, unset any existing baseline
    const existing = await pb.collection(COLLECTION).getFullList({
      filter: safeFilter`editionId = ${editionId} && isBaseline = ${true}`,
      fields: 'id'
    })
    for (const record of existing) {
      await pb.collection(COLLECTION).update(record.id as string, { isBaseline: false })
    }
    // Then set the new baseline
    await pb.collection(COLLECTION).update(scenarioId, { isBaseline: true })
  },

  async delete(id: string): Promise<void> {
    await pb.collection(COLLECTION).delete(id)
  },

  async countByEdition(editionId: string): Promise<number> {
    const records = await pb.collection(COLLECTION).getList(1, 1, {
      filter: safeFilter`editionId = ${editionId}`,
      fields: 'id'
    })
    return records.totalItems
  }
})

const mapRecordToScenario = (record: Record<string, unknown>): SimulationScenario => {
  let parameters: SimulationParameters = {
    expectedAttendees: 0,
    ticketPrice: 0,
    sponsorshipTarget: 0,
    fixedCosts: [],
    variableCostsPerAttendee: []
  }
  let results: SimulationResults | undefined

  try {
    const rawParams = record.parameters
    if (typeof rawParams === 'string') {
      parameters = JSON.parse(rawParams)
    } else if (rawParams && typeof rawParams === 'object') {
      parameters = rawParams as SimulationParameters
    }
  } catch {
    // Keep default parameters
  }

  try {
    const rawResults = record.results
    if (typeof rawResults === 'string' && rawResults.length > 0) {
      results = JSON.parse(rawResults)
    } else if (rawResults && typeof rawResults === 'object') {
      results = rawResults as SimulationResults
    }
  } catch {
    // Keep undefined results
  }

  return {
    id: record.id as string,
    editionId: record.editionId as string,
    name: record.name as string,
    description: (record.description as string) || undefined,
    parameters,
    results,
    isBaseline: (record.isBaseline as boolean) || false,
    createdBy: record.createdBy as string,
    createdAt: new Date(record.created as string),
    updatedAt: new Date(record.updated as string)
  }
}

export type SimulationScenarioRepository = ReturnType<typeof createSimulationScenarioRepository>
