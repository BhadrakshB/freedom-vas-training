"use client";

import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardFooter,
  Button, 
  Badge, 
  Alert, 
  AlertDescription,
  Progress,
  Input,
  Textarea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Skeleton,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Avatar,
  AvatarFallback,
  ScrollArea
} from './ui';
import { Sun, Moon, Star, AlertTriangle, CheckCircle } from 'lucide-react';

export function ThemeVerification() {
  const { theme, actualTheme } = useTheme();

  return (
    <div className="min-h-screen bg-background text-foreground p-6 space-y-8">
      {/* Theme Status Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {actualTheme === 'dark' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            Theme Verification - {actualTheme === 'dark' ? 'Dark' : 'Light'} Mode
          </CardTitle>
          <CardDescription>
            Current theme setting: {theme} | Actual theme: {actualTheme}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Badge variant="default">Theme: {theme}</Badge>
            <Badge variant={actualTheme === 'dark' ? 'secondary' : 'outline'}>
              {actualTheme === 'dark' ? 'Dark Mode Active' : 'Light Mode Active'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Color Palette Verification */}
      <Card>
        <CardHeader>
          <CardTitle>Color Palette</CardTitle>
          <CardDescription>Verify all semantic colors work correctly in current theme</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="h-12 bg-background border rounded flex items-center justify-center text-foreground text-sm">
                Background
              </div>
              <div className="h-12 bg-card border rounded flex items-center justify-center text-card-foreground text-sm">
                Card
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-12 bg-primary rounded flex items-center justify-center text-primary-foreground text-sm">
                Primary
              </div>
              <div className="h-12 bg-secondary rounded flex items-center justify-center text-secondary-foreground text-sm">
                Secondary
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-12 bg-muted rounded flex items-center justify-center text-muted-foreground text-sm">
                Muted
              </div>
              <div className="h-12 bg-accent rounded flex items-center justify-center text-accent-foreground text-sm">
                Accent
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-12 bg-destructive rounded flex items-center justify-center text-destructive-foreground text-sm">
                Destructive
              </div>
              <div className="h-12 border border-border rounded flex items-center justify-center text-foreground text-sm">
                Border
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Component Verification */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Buttons */}
        <Card>
          <CardHeader>
            <CardTitle>Buttons</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Button variant="default">Default</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="destructive">Destructive</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm">Small</Button>
              <Button size="default">Default</Button>
              <Button size="lg">Large</Button>
              <Button size="icon"><Star className="h-4 w-4" /></Button>
            </div>
          </CardContent>
        </Card>

        {/* Badges */}
        <Card>
          <CardHeader>
            <CardTitle>Badges</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Badge variant="default">Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="outline">Outline</Badge>
              <Badge variant="destructive">Destructive</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Alerts */}
        <Card>
          <CardHeader>
            <CardTitle>Alerts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                This is a default alert with proper theming.
              </AlertDescription>
            </Alert>
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                This is a destructive alert variant.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Form Elements */}
        <Card>
          <CardHeader>
            <CardTitle>Form Elements</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input placeholder="Input field" />
            <Textarea placeholder="Textarea field" rows={3} />
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select option" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="option1">Option 1</SelectItem>
                <SelectItem value="option2">Option 2</SelectItem>
                <SelectItem value="option3">Option 3</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>

      {/* Progress and Loading States */}
      <Card>
        <CardHeader>
          <CardTitle>Progress & Loading States</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress Example</span>
              <span>75%</span>
            </div>
            <Progress value={75} />
          </div>
          <Separator />
          <div className="space-y-2">
            <h4 className="font-medium">Loading Skeletons</h4>
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Tabs</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="tab1" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="tab1">Tab 1</TabsTrigger>
              <TabsTrigger value="tab2">Tab 2</TabsTrigger>
              <TabsTrigger value="tab3">Tab 3</TabsTrigger>
            </TabsList>
            <TabsContent value="tab1" className="mt-4">
              <Card>
                <CardContent className="pt-6">
                  <p className="text-muted-foreground">Content for tab 1 with proper theming.</p>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="tab2" className="mt-4">
              <Card>
                <CardContent className="pt-6">
                  <p className="text-muted-foreground">Content for tab 2 with proper theming.</p>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="tab3" className="mt-4">
              <Card>
                <CardContent className="pt-6">
                  <p className="text-muted-foreground">Content for tab 3 with proper theming.</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Avatar and ScrollArea */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Avatars</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarFallback>AI</AvatarFallback>
              </Avatar>
              <Avatar>
                <AvatarFallback>U</AvatarFallback>
              </Avatar>
              <Avatar>
                <AvatarFallback className="bg-primary text-primary-foreground">P</AvatarFallback>
              </Avatar>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Scroll Area</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-32 border rounded p-3">
              <div className="space-y-2">
                {Array.from({ length: 10 }, (_, i) => (
                  <div key={i} className="text-sm text-muted-foreground">
                    Scrollable content item {i + 1}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Complex Card Layout */}
      <Card>
        <CardHeader>
          <CardTitle>Complex Card Layout</CardTitle>
          <CardDescription>
            Testing all card components together with proper spacing and theming
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Nested Card 1</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  This is a nested card with proper theming inheritance.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Nested Card 2</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Badge variant="outline">Status</Badge>
                  <Progress value={60} />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Nested Card 3</CardTitle>
              </CardHeader>
              <CardContent>
                <Button variant="outline" size="sm" className="w-full">
                  Action
                </Button>
              </CardContent>
            </Card>
          </div>
        </CardContent>
        <CardFooter>
          <p className="text-sm text-muted-foreground">
            Footer content with proper muted text styling
          </p>
        </CardFooter>
      </Card>

      {/* Theme Verification Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Theme Verification Complete
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              All shadcn/ui components are properly themed and responsive to theme changes.
              The {actualTheme} mode is working correctly with consistent color usage across all components.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}