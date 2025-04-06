import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, BarChart3, Box, CheckCircle, Database, Shield, Users, MessageCircle, Github, Coffee } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-background to-muted/20 py-20" id="home">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              <span className="text-primary">KonBase</span>: Supply Chain Management for Conventions
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              All-in-one platform for conventions to manage inventory, track equipment, and streamline logistics.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button size="lg" asChild>
                <Link to="/register">Get Started <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <a href="#features">Learn More</a>
              </Button>
            </div>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section id="features" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Powerful Features</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything you need to manage your convention supplies and equipment in one place.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-card p-8 rounded-lg border">
              <Box className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-bold mb-2">Inventory Management</h3>
              <p className="text-muted-foreground">
                Track all your equipment, consumables, and assets with detailed records.
              </p>
            </div>
            
            <div className="bg-card p-8 rounded-lg border">
              <Database className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-bold mb-2">Convention Planning</h3>
              <p className="text-muted-foreground">
                Create and manage conventions with resource allocation and scheduling.
              </p>
            </div>
            
            <div className="bg-card p-8 rounded-lg border">
              <BarChart3 className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-bold mb-2">Reports & Analytics</h3>
              <p className="text-muted-foreground">
                Generate insights with customizable reports and real-time analytics.
              </p>
            </div>
            
            <div className="bg-card p-8 rounded-lg border">
              <Users className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-bold mb-2">Team Collaboration</h3>
              <p className="text-muted-foreground">
                Invite team members with customizable roles and permissions.
              </p>
            </div>
            
            <div className="bg-card p-8 rounded-lg border">
              <Shield className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-bold mb-2">Secure Access</h3>
              <p className="text-muted-foreground">
                Role-based access control and secure data storage.
              </p>
            </div>
            
            <div className="bg-card p-8 rounded-lg border">
              <CheckCircle className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-bold mb-2">Equipment Tracking</h3>
              <p className="text-muted-foreground">
                Track equipment movement and maintenance schedules.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* About Section */}
      <section id="about" className="py-20 bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">About KonBase</h2>
            <p className="text-xl text-muted-foreground mb-8">
              KonBase is an open-source project designed to help convention organizers streamline their supply chain and inventory management processes.
            </p>
            <p className="text-muted-foreground mb-6">
              Our mission is to provide a robust, easy-to-use platform that enables convention teams to focus on creating amazing experiences rather than worrying about logistics and inventory management.
            </p>
          </div>
        </div>
      </section>
      
      {/* Community Section */}
      <section className="py-20" id="community">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">Join Our Community</h2>
            <p className="text-xl text-muted-foreground mb-8">
              KonBase is built by the community, for the community. Get involved today!
            </p>
            
            <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
              <div className="bg-card p-8 rounded-lg border text-center">
                <MessageCircle className="h-12 w-12 mx-auto text-primary mb-4" />
                <h3 className="text-xl font-bold mb-2">Discord Community</h3>
                <p className="text-muted-foreground mb-4">
                  Join our Discord server to chat with other users, get help, and contribute to the project.
                </p>
                <Button variant="outline" asChild>
                  <a href="https://discord.gg/konbase" target="_blank" rel="noopener noreferrer">
                    Join Discord
                  </a>
                </Button>
              </div>
              
              <div className="bg-card p-8 rounded-lg border text-center">
                <Github className="h-12 w-12 mx-auto text-primary mb-4" />
                <h3 className="text-xl font-bold mb-2">GitHub Repository</h3>
                <p className="text-muted-foreground mb-4">
                  Star our repository, report issues, or contribute code to help improve KonBase.
                </p>
                <Button variant="outline" asChild>
                  <a href="https://github.com/ShiroLuxferre/KonBase" target="_blank" rel="noopener noreferrer">
                    Visit GitHub
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Sponsorship Section */}
      <section className="py-20 bg-muted/20" id="sponsor">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">Support KonBase</h2>
            <p className="text-xl text-muted-foreground mb-8">
              Help us continue developing KonBase as a free and open-source tool.
            </p>
            
            <div className="bg-card p-8 rounded-lg border max-w-md mx-auto">
              <Coffee className="h-12 w-12 mx-auto text-primary mb-4" />
              <h3 className="text-xl font-bold mb-2">Buy us a Coffee</h3>
              <p className="text-muted-foreground mb-6">
                Your contribution helps us maintain servers, develop new features, and keep KonBase free for everyone.
              </p>
              <Button asChild>
                <a href="https://www.buymeacoffee.com/konbase" target="_blank" rel="noopener noreferrer">
                  Buy me a Coffee
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-20 bg-primary/10">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to streamline your convention logistics?</h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of convention organizers who trust KonBase for their supply chain management.
          </p>
          <Button size="lg" asChild>
            <Link to="/register">Get Started Now <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Index;
