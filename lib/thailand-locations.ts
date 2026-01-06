// Thailand Provinces, Districts, and Sub-districts data
// Minimal version - optimized for client-side bundle size
// Data source: https://github.com/kongvut/thai-province-data

import thaiProvinceData from './thai-province-data-min.json'

export interface SubDistrict {
  name_th: string
  name_en: string
  zip_code?: number
}

export interface District {
  name_th: string
  name_en: string
  sub_districts: SubDistrict[]
}

export interface Province {
  name_th: string
  name_en: string
  districts: District[]
}

// Minimal data interface from the optimized JSON file
interface MinimalSubDistrict {
  n: string  // name_th
  e: string  // name_en
  z?: number // zip_code
}

interface MinimalDistrict {
  n: string  // name_th
  e: string  // name_en
  s: MinimalSubDistrict[]  // sub_districts
}

interface MinimalProvince {
  n: string  // name_th
  e: string  // name_en
  d: MinimalDistrict[]  // districts
}

// Transform minimal data to our full interface
function transformData(rawData: MinimalProvince[]): Province[] {
  return rawData.map((province) => ({
    name_th: province.n,
    name_en: province.e,
    districts: province.d.map((district) => ({
      name_th: district.n,
      name_en: district.e,
      sub_districts: district.s.map((subDistrict) => ({
        name_th: subDistrict.n,
        name_en: subDistrict.e,
        zip_code: subDistrict.z,
      })),
    })),
  }))
}

// Cache the transformed data
let cachedProvinces: Province[] | null = null

function getTransformedData(): Province[] {
  if (!cachedProvinces) {
    cachedProvinces = transformData(thaiProvinceData as MinimalProvince[])
  }
  return cachedProvinces
}

// Export the provinces data
export const THAILAND_PROVINCES: Province[] = getTransformedData()

// Helper functions
export function getProvinces(): Province[] {
  return THAILAND_PROVINCES
}

export function getDistrictsByProvince(provinceName: string): District[] {
  const province = THAILAND_PROVINCES.find(
    (p) => p.name_th === provinceName || p.name_en === provinceName
  )
  return province?.districts || []
}

export function getSubDistrictsByDistrict(
  provinceName: string,
  districtName: string
): SubDistrict[] {
  const districts = getDistrictsByProvince(provinceName)
  const district = districts.find(
    (d) => d.name_th === districtName || d.name_en === districtName
  )
  return district?.sub_districts || []
}

// Get province by name (Thai or English)
export function getProvinceByName(name: string): Province | undefined {
  return THAILAND_PROVINCES.find(
    (p) => p.name_th === name || p.name_en === name
  )
}

// Get district by name within a province
export function getDistrictByName(
  provinceName: string,
  districtName: string
): District | undefined {
  const districts = getDistrictsByProvince(provinceName)
  return districts.find(
    (d) => d.name_th === districtName || d.name_en === districtName
  )
}

// Get sub-district by name within a district
export function getSubDistrictByName(
  provinceName: string,
  districtName: string,
  subDistrictName: string
): SubDistrict | undefined {
  const subDistricts = getSubDistrictsByDistrict(provinceName, districtName)
  return subDistricts.find(
    (s) => s.name_th === subDistrictName || s.name_en === subDistrictName
  )
}
