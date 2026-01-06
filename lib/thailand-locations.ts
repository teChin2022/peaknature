// Thailand Provinces, Districts, and Sub-districts data
// Data source: https://github.com/kongvut/thai-province-data

import thaiProvinceData from './thai-province-data.json'

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

// Raw data interface from the JSON file
interface RawSubDistrict {
  id: number
  zip_code: number
  name_th: string
  name_en: string
  district_id: number
  lat: number | null
  long: number | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

interface RawDistrict {
  id: number
  name_th: string
  name_en: string
  province_id: number
  created_at: string
  updated_at: string
  deleted_at: string | null
  sub_districts: RawSubDistrict[]
}

interface RawProvince {
  id: number
  name_th: string
  name_en: string
  geography_id: number
  created_at: string
  updated_at: string
  deleted_at: string | null
  districts: RawDistrict[]
}

// Transform raw data to our simplified interface
function transformData(rawData: RawProvince[]): Province[] {
  return rawData.map((province) => ({
    name_th: province.name_th,
    name_en: province.name_en,
    districts: province.districts.map((district) => ({
      name_th: district.name_th,
      name_en: district.name_en,
      sub_districts: district.sub_districts.map((subDistrict) => ({
        name_th: subDistrict.name_th,
        name_en: subDistrict.name_en,
        zip_code: subDistrict.zip_code,
      })),
    })),
  }))
}

// Cache the transformed data
let cachedProvinces: Province[] | null = null

function getTransformedData(): Province[] {
  if (!cachedProvinces) {
    cachedProvinces = transformData(thaiProvinceData as RawProvince[])
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
