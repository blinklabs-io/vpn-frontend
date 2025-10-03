import Select from 'react-select'
import { filterOptions } from '../utils/instanceSort'

interface InstanceFilterProps {
  value: { value: string; label: string }
  onChange: (option: { value: string; label: string } | null) => void
}

const InstanceFilter = ({ value, onChange }: InstanceFilterProps) => {
  return (
    <div className="w-48">
      <Select
        value={value}
        onChange={onChange}
        options={filterOptions}
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

export default InstanceFilter

