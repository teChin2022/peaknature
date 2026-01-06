'use client'

import * as React from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'
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
import { Label } from '@/components/ui/label'

interface GuestLocationSelectorProps {
  province: string
  district: string
  subDistrict: string
  onProvinceChange: (value: string) => void
  onDistrictChange: (value: string) => void
  onSubDistrictChange: (value: string) => void
  primaryColor?: string
  labels?: {
    province?: string
    district?: string
    subDistrict?: string
    selectProvince?: string
    selectDistrict?: string
    selectSubDistrict?: string
    selectProvinceFirst?: string
    selectDistrictFirst?: string
    search?: string
    noResults?: string
    optional?: string
  }
}

const defaultLabels = {
  province: 'Province / จังหวัด',
  district: 'District / อำเภอ',
  subDistrict: 'Sub-district / ตำบล',
  selectProvince: 'Select province',
  selectDistrict: 'Select district',
  selectSubDistrict: 'Select sub-district',
  selectProvinceFirst: 'Select province first',
  selectDistrictFirst: 'Select district first',
  search: 'Search...',
  noResults: 'No location found',
  optional: '(optional)',
}

export function GuestLocationSelector({
  province,
  district,
  subDistrict,
  onProvinceChange,
  onDistrictChange,
  onSubDistrictChange,
  primaryColor = '#3B82F6',
  labels: customLabels,
}: GuestLocationSelectorProps) {
  const [provinceOpen, setProvinceOpen] = React.useState(false)
  const [districtOpen, setDistrictOpen] = React.useState(false)
  const [subDistrictOpen, setSubDistrictOpen] = React.useState(false)

  const labels = { ...defaultLabels, ...customLabels }
  const provinces = getProvinces()
  const districts = province ? getDistrictsByProvince(province) : []
  const subDistricts = district ? getSubDistrictsByDistrict(province, district) : []

  const selectedProvince = provinces.find(p => p.name_th === province)
  const selectedDistrict = districts.find(d => d.name_th === district)
  const selectedSubDistrict = subDistricts.find(s => s.name_th === subDistrict)

  return (
    <div className="space-y-4">
      {/* Province */}
      <div className="space-y-2">
        <Label>
          {labels.province} <span className="text-red-500">*</span>
        </Label>
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
              {selectedProvince ? (
                <span className="truncate">
                  {selectedProvince.name_th} ({selectedProvince.name_en})
                </span>
              ) : (
                <span className="text-gray-500">{labels.selectProvince}</span>
              )}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[350px] p-0 z-[100]" align="start">
            <Command>
              <CommandInput placeholder={labels.search} />
              <CommandList>
                <CommandEmpty>{labels.noResults}</CommandEmpty>
                <CommandGroup className="max-h-[300px] overflow-y-auto">
                  {provinces.map((p: Province) => (
                    <CommandItem
                      key={p.name_th}
                      value={`${p.name_th} ${p.name_en}`}
                      onSelect={() => {
                        onProvinceChange(p.name_th)
                        setProvinceOpen(false)
                      }}
                      className="cursor-pointer"
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          province === p.name_th ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <span>{p.name_th}</span>
                      <span className="ml-2 text-gray-500 text-sm">({p.name_en})</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* District */}
      <div className="space-y-2">
        <Label>
          {labels.district} <span className="text-stone-400 text-xs font-normal">{labels.optional}</span>
        </Label>
        <Popover open={districtOpen} onOpenChange={setDistrictOpen} modal={true}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              role="combobox"
              aria-expanded={districtOpen}
              className="w-full justify-between bg-white font-normal h-10 cursor-pointer"
              disabled={!province}
              onClick={() => province && setDistrictOpen(!districtOpen)}
            >
              {selectedDistrict ? (
                <span className="truncate">
                  {selectedDistrict.name_th} ({selectedDistrict.name_en})
                </span>
              ) : (
                <span className="text-gray-500">
                  {province ? labels.selectDistrict : labels.selectProvinceFirst}
                </span>
              )}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[350px] p-0 z-[100]" align="start">
            <Command>
              <CommandInput placeholder={labels.search} />
              <CommandList>
                <CommandEmpty>{labels.noResults}</CommandEmpty>
                <CommandGroup className="max-h-[300px] overflow-y-auto">
                  {districts.map((d: District) => (
                    <CommandItem
                      key={d.name_th}
                      value={`${d.name_th} ${d.name_en}`}
                      onSelect={() => {
                        onDistrictChange(d.name_th)
                        setDistrictOpen(false)
                      }}
                      className="cursor-pointer"
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          district === d.name_th ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <span>{d.name_th}</span>
                      <span className="ml-2 text-gray-500 text-sm">({d.name_en})</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* Sub-District */}
      <div className="space-y-2">
        <Label>
          {labels.subDistrict} <span className="text-stone-400 text-xs font-normal">{labels.optional}</span>
        </Label>
        <Popover open={subDistrictOpen} onOpenChange={setSubDistrictOpen} modal={true}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              role="combobox"
              aria-expanded={subDistrictOpen}
              className="w-full justify-between bg-white font-normal h-10 cursor-pointer"
              disabled={!district}
              onClick={() => district && setSubDistrictOpen(!subDistrictOpen)}
            >
              {selectedSubDistrict ? (
                <span className="truncate">
                  {selectedSubDistrict.name_th} ({selectedSubDistrict.name_en})
                </span>
              ) : (
                <span className="text-gray-500">
                  {district ? labels.selectSubDistrict : labels.selectDistrictFirst}
                </span>
              )}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[350px] p-0 z-[100]" align="start">
            <Command>
              <CommandInput placeholder={labels.search} />
              <CommandList>
                <CommandEmpty>{labels.noResults}</CommandEmpty>
                <CommandGroup className="max-h-[300px] overflow-y-auto">
                  {subDistricts.map((s: SubDistrict) => (
                    <CommandItem
                      key={s.name_th}
                      value={`${s.name_th} ${s.name_en} ${s.zip_code}`}
                      onSelect={() => {
                        onSubDistrictChange(s.name_th)
                        setSubDistrictOpen(false)
                      }}
                      className="cursor-pointer"
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          subDistrict === s.name_th ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <span>{s.name_th}</span>
                      <span className="ml-2 text-gray-500 text-sm">({s.name_en})</span>
                      <span className="ml-auto text-gray-400 text-xs">{s.zip_code}</span>
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

