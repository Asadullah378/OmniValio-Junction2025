import { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Package, LogOut, User, Globe } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Language } from '@/lib/types';

interface LayoutProps {
  children: ReactNode;
  navItems: Array<{
    label: string;
    path: string;
    icon: ReactNode;
  }>;
}

export function Layout({ children, navItems }: LayoutProps) {
  const { user, logout } = useAuth();
  const { language, setLanguage } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();

  const languageLabels: Record<Language, string> = {
    en: 'English',
    fi: 'Suomi',
    sv: 'Svenska',
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar */}
      <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="container flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <Package className="h-8 w-8 text-primary" />
            <h1 className="text-xl font-semibold">Omni-Valio</h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Role Badge */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary">
              <span className="text-sm font-medium capitalize">{user?.role}</span>
            </div>

            {/* Language Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Globe className="h-4 w-4" />
                  <span className="ml-2">{language.toUpperCase()}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setLanguage('en')}>
                  English {language === 'en' && '✓'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLanguage('fi')}>
                  Suomi {language === 'fi' && '✓'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLanguage('sv')}>
                  Svenska {language === 'sv' && '✓'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar>
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {user?.username.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{user?.username}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate(user?.role === 'customer' ? '/customer/profile' : '/admin/profile')}>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="sticky top-16 h-[calc(100vh-4rem)] w-64 border-r bg-card">
          <nav className="flex flex-col gap-1 p-4">
            {navItems.map((item) => {
              // Check exact match first
              const isExactMatch = location.pathname === item.path;
              
              // For startsWith check, only match if no other nav item has a more specific path that matches
              const isPrefixMatch = !isExactMatch && 
                location.pathname.startsWith(item.path + '/') &&
                !navItems.some(otherItem => 
                  otherItem.path !== item.path && 
                  otherItem.path.startsWith(item.path + '/') &&
                  location.pathname.startsWith(otherItem.path)
                );
              
              const isActive = isExactMatch || isPrefixMatch;
              
              return (
                <Link key={item.path} to={item.path}>
                  <Button
                    variant="ghost"
                    className={cn(
                      'w-full justify-start gap-3',
                      isActive && 'bg-primary/10 text-primary hover:bg-primary/20'
                    )}
                  >
                    {item.icon}
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <div className="container max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
