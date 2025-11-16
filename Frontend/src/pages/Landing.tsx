import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { 
  Sparkles, 
  Shield, 
  MessageSquare, 
  FileCheck,
  ArrowRight,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  Users,
  Bot,
  Package,
  AlertCircle,
  CreditCard,
  BarChart3,
  Zap,
  Menu,
  X,
  Phone,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Landing() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    message: ''
  });

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset form fields
    setFormData({
      name: '',
      company: '',
      email: '',
      message: ''
    });
    
    // Show success toast
    toast({
      title: 'Request submitted successfully!',
      description: 'We\'ll get back to you soon to schedule your demo.',
    });
    
    // You can add API call here if needed
    // console.log('Form submitted:', formData);
  };

  return (
    <div className="min-h-screen bg-[#F7F8FA]">
      {/* Navigation Bar */}
      <nav className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled ? "bg-white shadow-sm" : "bg-transparent"
      )}>
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900">Omni-Valio</span>
            </div>
            
            <div className="hidden md:flex items-center gap-8">
              <button 
                onClick={() => {
                  scrollToSection('features');
                  setMobileMenuOpen(false);
                }}
                className="text-gray-700 hover:text-blue-600 transition-colors"
              >
                Features
              </button>
              <button 
                onClick={() => {
                  scrollToSection('how-it-works');
                  setMobileMenuOpen(false);
                }}
                className="text-gray-700 hover:text-blue-600 transition-colors"
              >
                How it Works
              </button>
              <button 
                onClick={() => {
                  scrollToSection('for-kitchens');
                  setMobileMenuOpen(false);
                }}
                className="text-gray-700 hover:text-blue-600 transition-colors"
              >
                For Kitchens
              </button>
              <button 
                onClick={() => {
                  scrollToSection('for-operations');
                  setMobileMenuOpen(false);
                }}
                className="text-gray-700 hover:text-blue-600 transition-colors"
              >
                For Operations
              </button>
              <button 
                onClick={() => {
                  scrollToSection('contact');
                  setMobileMenuOpen(false);
                }}
                className="text-gray-700 hover:text-blue-600 transition-colors"
              >
                Contact
              </button>
            </div>

            <div className="flex items-center gap-4">
              <Button 
                variant="ghost"
                onClick={() => {
                  navigate('/login');
                  setMobileMenuOpen(false);
                }}
                className="hidden sm:inline-flex text-gray-700 hover:text-gray-900 hover:bg-gray-100"
              >
                Login
              </Button>
              <Button 
                onClick={() => {
                  scrollToSection('contact');
                  setMobileMenuOpen(false);
                }}
                className={cn(
                  "hidden sm:inline-flex transition-all",
                  scrolled ? "bg-blue-600 hover:bg-blue-700" : "bg-blue-600 hover:bg-blue-700"
                )}
              >
                Request Demo
              </Button>
              
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden text-gray-700 hover:text-blue-600"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-4 pb-4 border-t pt-4 space-y-3">
              <button 
                onClick={() => {
                  scrollToSection('features');
                  setMobileMenuOpen(false);
                }}
                className="block w-full text-left text-gray-700 hover:text-blue-600 transition-colors py-2"
              >
                Features
              </button>
              <button 
                onClick={() => {
                  scrollToSection('how-it-works');
                  setMobileMenuOpen(false);
                }}
                className="block w-full text-left text-gray-700 hover:text-blue-600 transition-colors py-2"
              >
                How it Works
              </button>
              <button 
                onClick={() => {
                  scrollToSection('for-kitchens');
                  setMobileMenuOpen(false);
                }}
                className="block w-full text-left text-gray-700 hover:text-blue-600 transition-colors py-2"
              >
                For Kitchens
              </button>
              <button 
                onClick={() => {
                  scrollToSection('for-operations');
                  setMobileMenuOpen(false);
                }}
                className="block w-full text-left text-gray-700 hover:text-blue-600 transition-colors py-2"
              >
                For Operations
              </button>
              <button 
                onClick={() => {
                  scrollToSection('contact');
                  setMobileMenuOpen(false);
                }}
                className="block w-full text-left text-gray-700 hover:text-blue-600 transition-colors py-2"
              >
                Contact
              </button>
              <Button 
                variant="ghost"
                onClick={() => {
                  navigate('/login');
                  setMobileMenuOpen(false);
                }}
                className="w-full text-gray-700 hover:text-gray-900 hover:bg-gray-100"
              >
                Login
              </Button>
              <Button 
                onClick={() => {
                  scrollToSection('contact');
                  setMobileMenuOpen(false);
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 mt-2"
              >
                Request Demo
              </Button>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Copy + CTAs */}
            <div className="space-y-8">
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Zero-fail deliveries for professional kitchens, powered by AI.
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed">
                Omni-Valio predicts shortages before they happen, manages substitutes, automates communication, and turns manual firefighting into a proactive, calm operation.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg" 
                  className="bg-blue-600 hover:bg-blue-700 text-white text-lg px-8 py-6"
                  onClick={() => scrollToSection('contact')}
                >
                  Book a Live Demo
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="text-lg px-8 py-6 border-2"
                  onClick={() => scrollToSection('how-it-works')}
                >
                  See How It Works
                </Button>
              </div>
            </div>

            {/* Right: Product Visual */}
            <div className="relative">
              <Card className="bg-gradient-to-br from-blue-50 to-white p-6 shadow-xl border-0">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Dashboard Overview</h3>
                    <Sparkles className="h-5 w-5 text-purple-500 animate-pulse" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                      <p className="text-sm text-gray-600">Deliveries Today</p>
                      <p className="text-3xl font-bold text-gray-900">24</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-orange-500">
                      <p className="text-sm text-gray-600">At-Risk Items</p>
                      <p className="text-3xl font-bold text-orange-600">3</p>
                    </div>
                  </div>

                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                    <div className="flex items-start gap-3">
                      <Bot className="h-5 w-5 text-purple-600 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-purple-900">AI Actions</p>
                        <p className="text-sm text-purple-700 mt-1">7 automated substitutions</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-blue-500">
                    <div className="flex items-start gap-3">
                      <MessageSquare className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">New Alert</p>
                        <p className="text-sm text-gray-600 mt-1">
                          We found a shortage for Milk 1L — propose substitute?
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Strip */}
      <section id="features" className="py-16 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-6">
            {[
              {
                icon: Sparkles,
                title: 'AI Risk Prediction',
                description: 'Predict shortages per item before picking starts.'
              },
              {
                icon: Package,
                title: 'Smart Substitutions',
                description: 'Pre-approved substitutes with instant invoice updates.'
              },
              {
                icon: MessageSquare,
                title: 'Unified Communication',
                description: 'Order + claim chats between kitchen, admin, and AI.'
              },
              {
                icon: FileCheck,
                title: 'Claims & Refund Automation',
                description: 'Photo-based claims with AI-first, human-safe review.'
              }
            ].map((feature, idx) => (
              <Card 
                key={idx}
                className="p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-0 bg-gray-50"
              >
                <feature.icon className="h-8 w-8 text-blue-600 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-600">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 px-6 bg-[#F7F8FA]">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-16">
            How Omni-Valio Works
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '1',
                title: 'Place Orders With Confidence',
                description: 'Chefs browse products, see live availability risk, and define up to two substitutes per item before checkout.',
                visual: (
                  <Card className="bg-white p-4 shadow-md">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Milk 1L</span>
                        <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full">Medium Risk</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Bread Whole Grain</span>
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">Safe</span>
                      </div>
                      <div className="pt-3 border-t">
                        <p className="text-xs text-gray-600">Substitutes selected: 2</p>
                      </div>
                    </div>
                  </Card>
                )
              },
              {
                step: '2',
                title: 'AI Monitors & Intervenes',
                description: 'As picking starts, Omni-Valio detects shortages, proposes the best substitutes, and coordinates confirmation via chat or voice.',
                visual: (
                  <Card className="bg-white p-4 shadow-md">
                    <div className="space-y-3">
                      <div className="bg-orange-50 p-3 rounded-lg border-l-4 border-orange-500">
                        <p className="text-sm font-medium text-orange-900">Order under risk</p>
                        <p className="text-xs text-orange-700 mt-1">Milk 1L shortage detected</p>
                      </div>
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <div className="flex items-start gap-2">
                          <Bot className="h-4 w-4 text-blue-600 mt-0.5" />
                          <p className="text-xs text-blue-900">Proposing substitute: Milk 2L</p>
                        </div>
                      </div>
                    </div>
                  </Card>
                )
              },
              {
                step: '3',
                title: 'Deliver, Claim, Resolve',
                description: 'Delivered orders feed into a streamlined claims flow where issues are handled by AI first, with humans only when needed—refunds and credits are generated automatically.',
                visual: (
                  <Card className="bg-white p-4 shadow-md">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span className="font-medium">Delivered</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <FileCheck className="h-4 w-4 text-blue-600" />
                        <span className="font-medium">Claim Submitted</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <CreditCard className="h-4 w-4 text-purple-600" />
                        <span className="font-medium">Refund Processed</span>
                      </div>
                    </div>
                  </Card>
                )
              }
            ].map((step, idx) => (
              <div key={idx} className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-600 text-white text-xl font-bold mb-6">
                  {step.step}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">{step.title}</h3>
                <p className="text-gray-600 mb-6 leading-relaxed">{step.description}</p>
                <div className="mt-6">{step.visual}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For Kitchens */}
      <section id="for-kitchens" className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Built for chefs, not spreadsheets.
              </h2>
              <ul className="space-y-4">
                {[
                  'One place to see all orders, statuses, and alerts.',
                  'Per-item risk and suggested substitutes at order time.',
                  'Embedded order and claim chats instead of long email threads.',
                  'Transparent invoices and refunds for every change.'
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <CheckCircle2 className="h-6 w-6 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span className="text-lg text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <Card className="bg-gradient-to-br from-blue-50 to-white p-6 shadow-xl">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Customer Dashboard</h3>
                <div className="space-y-3">
                  <div className="bg-white p-3 rounded-lg shadow-sm">
                    <p className="text-sm font-medium text-gray-900">Orders in Progress</p>
                    <p className="text-2xl font-bold text-blue-600 mt-1">3</p>
                  </div>
                  <div className="bg-orange-50 p-3 rounded-lg border-l-4 border-orange-500">
                    <p className="text-sm font-medium text-orange-900">Actions Needed</p>
                    <p className="text-sm text-orange-700 mt-1">1 order requires your attention</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg shadow-sm">
                    <div className="flex items-start gap-2">
                      <MessageSquare className="h-4 w-4 text-gray-600 mt-0.5" />
                      <p className="text-xs text-gray-600">New message from Valio Aimo</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* For Operations */}
      <section id="for-operations" className="py-24 px-6 bg-[#F7F8FA]">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <Card className="bg-gradient-to-br from-purple-50 to-white p-6 shadow-xl order-2 lg:order-1">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Admin Console</h3>
                <div className="space-y-3">
                  <div className="bg-white p-3 rounded-lg shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Order #12345</span>
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full">At Risk</span>
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded-lg shadow-sm">
                    <p className="text-sm font-medium text-gray-900 mb-2">Replace Product</p>
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <span>Milk 1L</span>
                      <ArrowRight className="h-3 w-3" />
                      <span>Milk 2L</span>
                    </div>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg border-l-4 border-green-500">
                    <p className="text-sm font-medium text-green-900">Invoice Updated</p>
                  </div>
                </div>
              </div>
            </Card>
            <div className="order-1 lg:order-2">
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Superpowers for logistics and customer ops.
              </h2>
              <ul className="space-y-4">
                {[
                  'Prioritized view of all orders and at-risk items.',
                  'Click to replace items with customer-approved substitutes.',
                  'Inventory and product management in one console.',
                  'AI triages claims; human teams handle only edge cases.'
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <CheckCircle2 className="h-6 w-6 text-purple-600 mt-0.5 flex-shrink-0" />
                    <span className="text-lg text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Deep Features */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-16">
            Smart Features That Make the Difference
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                icon: BarChart3,
                title: 'AI Risk Engine',
                detail: 'Per-line shortage probability, supplier reliability, seasonality.',
                benefit: 'Fewer surprises on delivery, better planning.'
              },
              {
                icon: Package,
                title: 'Substitute Management',
                detail: 'Customers pick substitutes; admins trigger replacements; invoices update automatically.',
                benefit: 'No phone chaos, fewer manual recalculations.'
              },
              {
                icon: MessageSquare,
                title: 'Order & Claims Chat',
                detail: 'One thread per order / claim for customer ↔ admin ↔ AI, with full history.',
                benefit: 'No lost context, fast decisions.'
              },
              {
                icon: FileCheck,
                title: 'Claims & Evidence',
                detail: 'Upload photos, AI pre-screens claims, admins click to approve/reject and refunds flow into payment page.',
                benefit: 'Speed with safety.'
              }
            ].map((feature, idx) => (
              <Card key={idx} className="p-8 hover:shadow-xl transition-all duration-300 border-0 bg-gray-50">
                <feature.icon className="h-10 w-10 text-blue-600 mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 mb-3">{feature.detail}</p>
                <p className="text-sm font-medium text-blue-600">{feature.benefit}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Business Value */}
      <section className="py-24 px-6 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-16">
            From reactive firefighting to proactive reliability.
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: TrendingDown,
                metric: '40%',
                description: 'reduction in manual "Where is my order?" calls'
              },
              {
                icon: TrendingUp,
                metric: '15%',
                description: 'improvement in fill rate on critical SKUs'
              },
              {
                icon: Users,
                metric: '1',
                description: 'full operations team\'s workload saved at scale'
              }
            ].map((stat, idx) => (
              <Card key={idx} className="p-8 text-center bg-white shadow-lg border-0">
                <stat.icon className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <p className="text-5xl font-bold text-gray-900 mb-2">{stat.metric}</p>
                <p className="text-gray-600">{stat.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm text-gray-500 uppercase tracking-wide mb-8">
            Trusted by forward-thinking foodservice teams
          </p>
          
          <Card className="p-8 bg-gray-50 border-0 shadow-md">
            <p className="text-xl text-gray-700 italic mb-6">
              "Now our chefs know about problems before trucks leave the warehouse."
            </p>
            <p className="text-sm font-medium text-gray-900">
              – Head of Operations, Unicafe, Kumpula
            </p>
          </Card>
        </div>
      </section>

      {/* 24/7 Live AI Voice Agent */}
      <section className="py-24 px-6 bg-[#F7F8FA]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full mb-6">
              <Clock className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">24/7 Available</span>
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              24/7 Live AI Voice Agent
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Get instant help with our AI-powered voice agent, available round the clock on our website and via phone.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 mb-12">
            <Card className="p-8 bg-white border-0 shadow-md hover:shadow-lg transition-all duration-300">
              <div className="flex items-start gap-4 mb-6">
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-blue-50">
                  <Bot className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Available on Website</h3>
                  <p className="text-gray-600">
                    Chat with our AI agent directly from the customer portal. Get instant answers about orders, inventory, claims, and more.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-8 bg-white border-0 shadow-md hover:shadow-lg transition-all duration-300">
              <div className="flex items-start gap-4 mb-6">
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-blue-50">
                  <Phone className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Call Us Anytime</h3>
                  <p className="text-gray-600 mb-4">
                    Speak with our AI voice agent over the phone for immediate assistance.
                  </p>
                  <a 
                    href="tel:+16505025185" 
                    className="text-2xl font-semibold text-blue-600 hover:text-blue-700 transition-colors inline-flex items-center gap-2"
                  >
                    +1 (650) 502-5185
                  </a>
                </div>
              </div>
            </Card>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Bot,
                title: 'Instant Responses',
                description: 'Get answers to common questions instantly'
              },
              {
                icon: MessageSquare,
                title: 'Order Tracking',
                description: 'Check order status and delivery updates'
              },
              {
                icon: Package,
                title: 'Product Information',
                description: 'Learn about products, availability, and substitutes'
              },
              {
                icon: FileCheck,
                title: 'Claims Support',
                description: 'Get help with claims and refunds'
              }
            ].map((feature, idx) => (
              <Card 
                key={idx}
                className="p-6 bg-white border-0 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1"
              >
                <feature.icon className="h-8 w-8 text-blue-600 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-600">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section id="contact" className="py-24 px-6 bg-[#F7F8FA]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              See Omni-Valio in action.
            </h2>
            <p className="text-xl text-gray-600">
              We're piloting Omni-Valio with selected partners. Book a session and see how AI can simplify your logistics.
            </p>
          </div>

          <Card className="p-8 bg-white shadow-xl border-0">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name *
                  </label>
                  <Input
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Your name"
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company *
                  </label>
                  <Input
                    required
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    placeholder="Unicafe, Kumpula"
                    className="w-full"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <Input
                  required
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="your.email@company.com"
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message
                </label>
                <Textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Tell us about your needs..."
                  rows={4}
                  className="w-full"
                />
              </div>
              <Button 
                type="submit"
                size="lg"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                Request Demo
              </Button>
            </form>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Package className="h-6 w-6" />
            <span className="text-xl font-bold">Omni-Valio</span>
          </div>
          <p className="text-gray-400 text-sm">
            © 2025 Omni-Valio. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

