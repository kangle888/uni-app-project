import flightsApi from './flights.api.en.json'
import type { SearchEdition } from './quick-search.api'

export type RawFlight = {
  id: number
  flightNo: string
  airline: string
  departureCity: string
  departureAirport: string
  departureTime: string
  arrivalCity: string
  arrivalAirport: string
  arrivalTime: string
  ['666版']: number | string
  ['2666版']: number | string
}

export type ItineraryItem = {
  id: string
  legs: RawFlight[]
  transferCities: string[]
  transferCount: number
  totalDurationText: string
}

const flights = ((flightsApi as any)?.data || []) as RawFlight[]

const inEdition = (item: RawFlight, edition: SearchEdition) => {
  const key = edition === 666 ? '666版' : '2666版'
  return Number(item[key]) === edition
}

const parseMinutes = (time: string) => {
  const text = String(time || '').trim()
  const match = text.match(/(\d{1,2}):(\d{2})/)
  if (!match) return 0

  const h = Number(match[1])
  const m = Number(match[2])
  if (Number.isNaN(h) || Number.isNaN(m)) return 0

  return h * 60 + m
}

const legDuration = (dep: string, arr: string) => {
  const depMinutes = parseMinutes(dep)
  const arrMinutes = parseMinutes(arr)

  let minutes = arrMinutes - depMinutes
  if (minutes < 0 || String(arr || '').includes('+1')) minutes += 24 * 60

  return Math.max(0, minutes)
}

const toDurationText = (minutes: number) => {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h}h${m}m`
}

export const searchItineraries = async (params: {
  fromCity: string
  toCity: string
  maxTransferCount: number
  editions: SearchEdition[]
}) => {
  const { fromCity, toCity, maxTransferCount, editions } = params

  const safeTransferCount = 1
  const MAX_SEARCH_NODES = 12000
  const MAX_RESULTS = 120

  const candidateFlights = flights.filter((f) =>
    editions.some((ed) => inEdition(f, ed)),
  )
  const byFrom = new Map<string, RawFlight[]>()
  candidateFlights.forEach((f) => {
    if (!byFrom.has(f.departureCity)) byFrom.set(f.departureCity, [])
    byFrom.get(f.departureCity)?.push(f)
  })

  const maxLegs = Math.max(1, safeTransferCount + 1)
  const result: ItineraryItem[] = []
  let visitedNodes = 0

  const dfs = (city: string, path: RawFlight[], visited: Set<string>) => {
    if (path.length > maxLegs) return
    if (visitedNodes >= MAX_SEARCH_NODES || result.length >= MAX_RESULTS) return

    visitedNodes += 1
    if (city === toCity && path.length > 0) {
      const minutes = path.reduce(
        (sum, leg) => sum + legDuration(leg.departureTime, leg.arrivalTime),
        0,
      )
      const transferCities = path.slice(0, -1).map((p) => p.arrivalCity)
      result.push({
        id: path.map((p) => p.id).join('-'),
        legs: [...path],
        transferCities,
        transferCount: Math.max(0, path.length - 1),
        totalDurationText: toDurationText(minutes),
      })
      return
    }

    if (path.length === maxLegs) return

    const nextFlights = byFrom.get(city) || []
    nextFlights.forEach((flight) => {
      const nextCity = flight.arrivalCity
      if (visited.has(nextCity)) return
      path.push(flight)
      visited.add(nextCity)
      dfs(nextCity, path, visited)
      visited.delete(nextCity)
      path.pop()
    })
  }

  dfs(fromCity, [], new Set([fromCity]))

  return result.sort((a, b) => a.transferCount - b.transferCount)
}
