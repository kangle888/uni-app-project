import citiesApi from './cities.api.en.json'
import flightsApi from './flights.api.en.json'

export type SearchEdition = 666 | 2666

export type CityItem = {
  id: number
  name: string
  latitude: number
  longitude: number
  province: string
}

export type FlightItem = {
  id: number
  flightNo: string
  airline: string
  departureCity: string
  departureLatitude: number
  departureLongitude: number
  arrivalCity: string
  arrivalLatitude: number
  arrivalLongitude: number
  ['666版']: number | string
  ['2666版']: number | string
}

const cities = ((citiesApi as any)?.data || []) as CityItem[]
const flights = ((flightsApi as any)?.data || []) as FlightItem[]

const matchEdition = (item: FlightItem, edition: SearchEdition) => {
  const key = edition === 666 ? '666版' : '2666版'
  return Number(item[key]) === edition
}

export const getCityProvinces = async (keyword = '') => {
  const kw = keyword.trim()
  const grouped = new Map<string, CityItem[]>()

  cities.forEach((city) => {
    if (!grouped.has(city.province)) grouped.set(city.province, [])
    grouped.get(city.province)?.push(city)
  })

  const result = Array.from(grouped.entries()).map(([name, list]) => ({
    name,
    cities: list,
  }))

  if (!kw) return result

  return result
    .map((p) => ({
      ...p,
      cities: p.cities.filter(
        (c) => c.name.includes(kw) || c.province.includes(kw),
      ),
    }))
    .filter((p) => p.name.includes(kw) || p.cities.length > 0)
}

export const searchFlights = async (params: {
  edition: SearchEdition
  fromCity: string
  toCity?: string
}) => {
  const { edition, fromCity, toCity } = params

  return flights.filter((item) => {
    if (!matchEdition(item, edition)) return false
    if (item.departureCity !== fromCity) return false
    if (toCity && item.arrivalCity !== toCity) return false
    return true
  })
}
