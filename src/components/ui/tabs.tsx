import * as React from "react"
import { cn } from "../../lib/utils"

const Tabs = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & { defaultValue?: string }
>(({ className, defaultValue, ...props }, ref) => {
    const [activeTab, setActiveTab] = React.useState(defaultValue)

    // Clone children to pass context (simple implementation without context provider for speed)
    const childrenWithProps = React.Children.map(props.children, child => {
        if (React.isValidElement(child)) {
            return React.cloneElement(child as any, { activeTab, setActiveTab })
        }
        return child
    })

    return (
        <div
            ref={ref}
            className={cn("w-full", className)}
            {...props}
        >
            {childrenWithProps}
        </div>
    )
})
Tabs.displayName = "Tabs"

const TabsList = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn(
            "inline-flex h-10 items-center justify-center rounded-md bg-slate-100 p-1 text-slate-500",
            className
        )}
        {...props}
    />
))
TabsList.displayName = "TabsList"

const TabsTrigger = React.forwardRef<
    HTMLButtonElement,
    React.HTMLAttributes<HTMLButtonElement> & { value: string, activeTab?: string, setActiveTab?: (v: string) => void }
>(({ className, value, activeTab, setActiveTab, onClick, ...props }, ref) => {
    const isActive = activeTab === value;
    return (
        <button
            ref={ref}
            className={cn(
                "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                isActive ? "bg-white text-slate-950 shadow-sm" : "hover:bg-slate-200/50 hover:text-slate-900",
                className
            )}
            onClick={(e) => {
                setActiveTab?.(value);
                onClick?.(e);
            }}
            data-state={isActive ? "active" : "inactive"}
            {...props}
        />
    )
})
TabsTrigger.displayName = "TabsTrigger"

const TabsContent = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & { value: string, activeTab?: string }
>(({ className, value, activeTab, ...props }, ref) => {
    if (activeTab !== value) return null;
    return (
        <div
            ref={ref}
            className={cn(
                "mt-2 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 animate-in fade-in zoom-in-95 duration-200",
                className
            )}
            {...props}
        />
    )
})
TabsContent.displayName = "TabsContent"

export { Tabs, TabsList, TabsTrigger, TabsContent }
