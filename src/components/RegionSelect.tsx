import Select from 'react-select'

interface RegionSelectProps {
  value: string
  onChange: (region: string) => void
  regions: string[]
  disabled?: boolean
  showTooltips?: boolean
}

const RegionSelect = ({ value, onChange, regions, disabled, showTooltips }: RegionSelectProps) => {
  const options = regions.map(region => ({
    value: region,
    label: region.toUpperCase()
  }))

  const selectedOption = options.find(opt => opt.value === value) || options[0]

  return (
    <div className="w-48" {...(showTooltips && { 'data-tooltip-id': 'region-tooltip' })}>
      <Select
        value={selectedOption}
        onChange={(option) => option && onChange(option.value)}
        options={options}
        isDisabled={disabled}
        styles={{
          control: (base) => ({
            ...base,
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderColor: 'rgba(255, 255, 255, 0.2)',
            color: 'white',
            minHeight: '40px'
          }),
          singleValue: (base) => ({
            ...base,
            color: 'white'
          }),
          option: (base, state) => ({
            ...base,
            backgroundColor: state.isSelected 
              ? 'rgba(148, 0, 255, 0.8)' 
              : state.isFocused 
                ? 'rgba(148, 0, 255, 0.3)' 
                : 'rgba(0, 0, 0, 0.8)',
            color: 'white'
          }),
          menu: (base) => ({
            ...base,
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }),
          placeholder: (base) => ({
            ...base,
            color: 'rgba(255, 255, 255, 0.7)'
          })
        }}
        theme={(theme) => ({
          ...theme,
          colors: {
            ...theme.colors,
            primary: 'rgba(148, 0, 255, 0.8)',
            primary75: 'rgba(148, 0, 255, 0.6)',
            primary50: 'rgba(148, 0, 255, 0.4)',
            primary25: 'rgba(148, 0, 255, 0.2)',
          }
        })}
      />
    </div>
  )
}

export default RegionSelect

