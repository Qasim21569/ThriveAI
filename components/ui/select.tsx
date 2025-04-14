import * as React from "react"

const Select = ({ children, ...props }) => <div {...props}>{children}</div>
const SelectGroup = ({ children, ...props }) => <div {...props}>{children}</div>
const SelectValue = ({ children, ...props }) => <div {...props}>{children}</div>
const SelectTrigger = ({ children, className, ...props }) => <button className={className} {...props}>{children}</button>
const SelectContent = ({ children, className, ...props }) => <div className={className} {...props}>{children}</div>
const SelectLabel = ({ children, className, ...props }) => <div className={className} {...props}>{children}</div>
const SelectItem = ({ children, className, ...props }) => <div className={className} {...props}>{children}</div>
const SelectSeparator = ({ className, ...props }) => <div className={className} {...props} />
const SelectScrollUpButton = ({ className, ...props }) => <button className={className} {...props} />
const SelectScrollDownButton = ({ className, ...props }) => <button className={className} {...props} />

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
} 