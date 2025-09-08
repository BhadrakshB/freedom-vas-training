// Export only actively used shadcn/ui components for optimal tree-shaking
// Core components used across the application
export { Button } from "./button"
export { Input } from "./input"
export { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "./card"
export { Badge } from "./badge"
export { Alert, AlertDescription, AlertTitle } from "./alert"

// Progress and feedback components
export { Progress } from "./progress"
export { Skeleton } from "./skeleton"

// Form components
export { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select"
export { Textarea } from "./textarea"

// Layout components
export { Separator } from "./separator"
export { ScrollArea } from "./scroll-area"
export { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs"

// User interface components
export { Avatar, AvatarFallback, AvatarImage } from "./avatar"

// Dialog components (conditionally exported - may be used in future)
export { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "./dialog"

// Sheet components for mobile responsive panels
export { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "./sheet"

// Note: CardDescription and CardFooter are available but not currently used
// They can be added back if needed without affecting bundle size significantly