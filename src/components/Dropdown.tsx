import type { DropdownOption } from "../types/types";

export interface DropdownProps {
    id?: string;
    value: string;
    onChange: (value: string) => void;
    options: DropdownOption[];
    // For temporarily hiding the dropdown (e.g. while saving)
    disabled?: boolean;
}

export function Dropdown({id, value, onChange, options, disabled=false}: DropdownProps) {
    return (<select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="dropdown"
        disabled={disabled}
    >
        {/* Generate options based on props*/}
        {options.map((option) => (<option key={option.value} value={option.value}>{option.label}</option>))}
    </select>);
}