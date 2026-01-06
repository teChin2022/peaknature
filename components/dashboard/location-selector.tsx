'use client'

import * as React from 'react'
import { Check, ChevronsUpDown, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { 
  getProvinces, 
  getDistrictsByProvince, 
  getSubDistrictsByDistrict,
  Province,
  District,
  SubDistrict
} from '@/lib/thailand-locations'

interface LocationSelectorProps {
  location: {
    province: string
    province_en: string
    district: string
    district_en: string
    sub_district: string
    sub_district_en: string
    postal_code: string
  }
  onChange: (location: LocationSelectorProps['location']) => void
  translations: {
    province: string
    district: string
    subDistrict: string
    selectProvince: string
    selectDistrict: string
    selectSubDistrict: string
    selectProvinceFirst: string
    selectDistrictFirst: string
    searchPlaceholder: string
    noResults: string
  }
}

export function LocationSelector({ location, onChange, translations }: LocationSelectorProps) {
  const [provinceOpen, setProvinceOpen] = React.useState(false)
  const [districtOpen, setDistrictOpen] = React.useState(false)
  const [subDistrictOpen, setSubDistrictOpen] = React.useState(false)

  const provinces = getProvinces()
  const districts = location.province ? getDistrictsByProvince(location.province) : []
  const subDistricts = location.district ? getSubDistrictsByDistrict(location.province, location.district) : []

  const handleProvinceSelect = (provinceName: string) => {
    const province = provinces.find(p => p.name_th === provinceName)
    onChange({
      province: provinceName,
      province_en: province?.name_en || '',
      district: '',
      district_en: '',
      sub_district: '',
      sub_district_en: '',
      postal_code: '',
    })
    setProvinceOpen(false)
  }

  const handleDistrictSelect = (districtName: string) => {
    const district = districts.find(d => d.name_th === districtName)
    onChange({
      ...location,
      district: districtName,
      district_en: district?.name_en || '',
      sub_district: '',
      sub_district_en: '',
      postal_code: '',
    })
    setDistrictOpen(false)
  }

  const handleSubDistrictSelect = (subDistrictName: string) => {
    const subDistrict = subDistricts.find(s => s.name_th === subDistrictName)
    onChange({
      ...location,
      sub_district: subDistrictName,
      sub_district_en: subDistrict?.name_en || '',
      postal_code: subDistrict?.zip_code?.toString() || '',
    })
    setSubDistrictOpen(false)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Province Selector */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">{translations.province}</label>
        <Popover open={provinceOpen} onOpenChange={setProvinceOpen} modal={true}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              role="combobox"
              aria-expanded={provinceOpen}
              className="w-full justify-between bg-white font-normal h-10 cursor-pointer"
              onClick={() => setProvinceOpen(!provinceOpen)}
            >
              {location.province ? (
                <span className="truncate">
                  {location.province} ({location.province_en})
                </span>
              ) : (
                <span className="text-gray-500">{translations.selectProvince}</span>
              )}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[350px] p-0 z-[100]" align="start">
            <Command>
              <CommandInput placeholder={translations.searchPlaceholder} />
              <CommandList>
                <CommandEmpty>{translations.noResults}</CommandEmpty>
                <CommandGroup className="max-h-[300px] overflow-y-auto">
                  {provinces.map((province: Province) => (
                    <CommandItem
                      key={province.name_th}
                      value={`${province.name_th} ${province.name_en}`}
                      onSelect={() => handleProvinceSelect(province.name_th)}
                      className="cursor-pointer"
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          location.province === province.name_th ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <span>{province.name_th}</span>
                      <span className="ml-2 text-gray-500 text-sm">({province.name_en})</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* District Selector */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">{translations.district}</label>
        <Popover open={districtOpen} onOpenChange={setDistrictOpen} modal={true}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              role="combobox"
              aria-expanded={districtOpen}
              className="w-full justify-between bg-white font-normal h-10 cursor-pointer"
              disabled={!location.province}
              onClick={() => location.province && setDistrictOpen(!districtOpen)}
            >
              {location.district ? (
                <span className="truncate">
                  {location.district} ({location.district_en})
                </span>
              ) : (
                <span className="text-gray-500">
                  {location.province ? translations.selectDistrict : translations.selectProvinceFirst}
                </span>
              )}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[350px] p-0 z-[100]" align="start">
            <Command>
              <CommandInput placeholder={translations.searchPlaceholder} />
              <CommandList>
                <CommandEmpty>{translations.noResults}</CommandEmpty>
                <CommandGroup className="max-h-[300px] overflow-y-auto">
                  {districts.map((district: District) => (
                    <CommandItem
                      key={district.name_th}
                      value={`${district.name_th} ${district.name_en}`}
                      onSelect={() => handleDistrictSelect(district.name_th)}
                      className="cursor-pointer"
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          location.district === district.name_th ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <span>{district.name_th}</span>
                      <span className="ml-2 text-gray-500 text-sm">({district.name_en})</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* Sub-District Selector */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">{translations.subDistrict}</label>
        <Popover open={subDistrictOpen} onOpenChange={setSubDistrictOpen} modal={true}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              role="combobox"
              aria-expanded={subDistrictOpen}
              className="w-full justify-between bg-white font-normal h-10 cursor-pointer"
              disabled={!location.district}
              onClick={() => location.district && setSubDistrictOpen(!subDistrictOpen)}
            >
              {location.sub_district ? (
                <span className="truncate">
                  {location.sub_district} ({location.sub_district_en})
                </span>
              ) : (
                <span className="text-gray-500">
                  {location.district ? translations.selectSubDistrict : translations.selectDistrictFirst}
                </span>
              )}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[350px] p-0 z-[100]" align="start">
            <Command>
              <CommandInput placeholder={translations.searchPlaceholder} />
              <CommandList>
                <CommandEmpty>{translations.noResults}</CommandEmpty>
                <CommandGroup className="max-h-[300px] overflow-y-auto">
                  {subDistricts.map((sub: SubDistrict) => (
                    <CommandItem
                      key={sub.name_th}
                      value={`${sub.name_th} ${sub.name_en} ${sub.zip_code}`}
                      onSelect={() => handleSubDistrictSelect(sub.name_th)}
                      className="cursor-pointer"
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          location.sub_district === sub.name_th ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <span>{sub.name_th}</span>
                      <span className="ml-2 text-gray-500 text-sm">({sub.name_en})</span>
                      <span className="ml-auto text-gray-400 text-xs">{sub.zip_code}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}

