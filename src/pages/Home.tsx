
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { ArrowRight, ExternalLink, Github, LayoutDashboard, LogOut, CheckCircle } from 'lucide-react';
import { AspectRatio } from '@/components/ui/aspect-ratio';

const Home = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const features = [
    {
      title: "Association Management",
      description: "Create and manage your fantasy associations, clubs and organizations with ease.",
      icon: <CheckCircle className="h-5 w-5 text-primary" />
    },
    {
      title: "Inventory Tracking",
      description: "Track all your equipment, consumables and assets in a centralized system.",
      icon: <CheckCircle className="h-5 w-5 text-primary" />
    },
    {
      title: "Convention Planning",
      description: "Plan and organize conventions with comprehensive resource allocation.",
      icon: <CheckCircle className="h-5 w-5 text-primary" />
    },
    {
      title: "Team Collaboration",
      description: "Collaborate with your team through role-based permissions and shared workspaces.",
      icon: <CheckCircle className="h-5 w-5 text-primary" />
    },
    {
      title: "Reporting & Analytics",
      description: "Generate detailed reports on inventory usage, convention performance and more.",
      icon: <CheckCircle className="h-5 w-5 text-primary" />
    },
    {
      title: "Secure Access Control",
      description: "Control access with role-based permissions and enhanced security features.",
      icon: <CheckCircle className="h-5 w-5 text-primary" />
    }
  ];

  const handleDashboard = () => {
    navigate('/dashboard');
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero section */}
      <section className="relative">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="max-w-2xl">
              <h1 className="text-3xl md:text-5xl font-bold tracking-tighter mb-6">
                KonBase Supply Chain Management
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                The complete solution for fantasy clubs and convention organizers to manage equipment, 
                inventory, and event planning in one centralized system.
              </p>
              
              {user ? (
                <div className="flex flex-wrap gap-4">
                  <Button size="lg" onClick={handleDashboard}>
                    Go to Dashboard <LayoutDashboard className="ml-2 h-5 w-5" />
                  </Button>
                  <Button variant="outline" size="lg" onClick={handleLogout}>
                    Logout <LogOut className="ml-2 h-5 w-5" />
                  </Button>
                </div>
              ) : (
                <div className="flex flex-wrap gap-4">
                  <Button size="lg" onClick={() => navigate('/login')}>
                    Login <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                  <Button variant="outline" size="lg" onClick={() => navigate('/register')}>
                    Register
                  </Button>
                </div>
              )}
            </div>
            
            <div className="w-full md:w-1/3 border rounded-xl overflow-hidden shadow-lg">
              <AspectRatio ratio={4/3} className="bg-muted">
                <div className="flex h-full w-full items-center justify-center bg-primary/10">
                  <p className="text-2xl font-bold text-primary">KonBase</p>
                </div>
              </AspectRatio>
            </div>
          </div>
        </div>
      </section>

      {/* Features section */}
      <section className="bg-muted/50 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl font-bold mb-4">Powerful Features</h2>
            <p className="text-muted-foreground">
              Everything you need to manage your convention supply chain from planning to execution.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {feature.icon}
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Open Source section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <Card className="border-2 border-primary/20">
            <CardHeader>
              <CardTitle className="text-2xl">Open Source Project</CardTitle>
              <CardDescription>
                KonBase is an open source project aimed at helping fantasy clubs and convention organizers.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                We believe in the power of community contributions to make KonBase better for everyone.
                Whether you're a developer, designer, or user with feedback, we welcome your participation.
              </p>
              <p>
                Join us on GitHub to contribute features, report bugs, or suggest improvements!
              </p>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="gap-2" onClick={() => window.open('https://github.com/ShiroLuxferre/KonBase', '_blank')}>
                <Github className="h-4 w-4" />
                Contribute on GitHub
                <ExternalLink className="h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default Home;
