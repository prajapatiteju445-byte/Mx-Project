import { motion } from 'framer-motion';
import { Shield, Users, MapPin, Phone, AlertCircle, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Landing() {
  const handleLogin = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + '/dashboard';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <div className="min-h-screen bg-[#FAFAF9]">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.pexels.com/photos/11962446/pexels-photo-11962446.jpeg" 
            alt="Confident woman walking safely at night"
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/20"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 py-12 md:py-24 text-center">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
          >
            <div className="flex items-center justify-center mb-6">
              <Shield className="w-16 h-16 text-primary" />
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-outfit font-bold text-[#1C1917] mb-6 tracking-tight">
              SafeHer
            </h1>
            <p className="text-xl sm:text-2xl text-stone-600 mb-4 font-outfit font-medium">
              Your Guardian in Your Pocket
            </p>
            <p className="text-base sm:text-lg text-stone-500 mb-12 max-w-2xl mx-auto font-jakarta leading-relaxed">
              Advanced safety features designed for women. Real-time emergency alerts, 
              AI-powered distress detection, and community support at your fingertips.
            </p>
            <Button 
              onClick={handleLogin}
              data-testid="landing-login-button"
              className="h-14 px-10 rounded-full bg-primary text-white hover:bg-primary/90 text-lg font-jakarta font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Get Started →
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-outfit font-bold text-[#1C1917] mb-4">
              Powerful Safety Features
            </h2>
            <p className="text-lg text-stone-600 font-jakarta max-w-2xl mx-auto">
              Everything you need to stay safe, connected, and protected
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <AlertCircle className="w-12 h-12 text-emergency" />,
                title: "Emergency SOS",
                description: "One-tap panic button that instantly alerts your emergency contacts and shares your real-time location"
              },
              {
                icon: <Shield className="w-12 h-12 text-primary" />,
                title: "AI Distress Detection",
                description: "Advanced AI analyzes your situation and automatically triggers alerts when danger is detected"
              },
              {
                icon: <Users className="w-12 h-12 text-safe" />,
                title: "Community Reporting",
                description: "Share and view safety incidents in your area to make informed decisions about your routes"
              },
              {
                icon: <MapPin className="w-12 h-12 text-warning" />,
                title: "Safety Zone Mapping",
                description: "Find nearby police stations, hospitals, and safe houses with real-time navigation"
              },
              {
                icon: <Phone className="w-12 h-12 text-primary" />,
                title: "Fake Call Feature",
                description: "Generate realistic fake calls to discretely exit uncomfortable situations"
              },
              {
                icon: <Heart className="w-12 h-12 text-emergency" />,
                title: "24/7 Monitoring",
                description: "Continuous location tracking during emergencies ensures help can reach you quickly"
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ y: 20, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="card-safe p-6 md:p-8"
              >
                <div className="mb-4">{feature.icon}</div>
                <h3 className="text-xl font-outfit font-semibold text-[#1C1917] mb-3">
                  {feature.title}
                </h3>
                <p className="text-stone-600 font-jakarta leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Community Section */}
      <section className="py-12 md:py-24 bg-secondary/10">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <img 
                src="https://images.unsplash.com/photo-1745962981420-66d0ca892373?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Njl8MHwxfHNlYXJjaHw0fHxkaXZlcnNlJTIwd29tZW4lMjBncm91cCUyMGNvbW11bml0eSUyMHN1cHBvcnR8ZW58MHx8fHwxNzY3OTU4NzgzfDA&ixlib=rb-4.1.0&q=85"
                alt="Diverse group of women supporting each other"
                className="rounded-3xl shadow-2xl w-full h-auto"
              />
            </motion.div>
            <motion.div
              initial={{ x: 20, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl sm:text-4xl font-outfit font-bold text-[#1C1917] mb-6">
                Join a Community That Cares
              </h2>
              <p className="text-lg text-stone-600 font-jakarta mb-6 leading-relaxed">
                SafeHer is more than an app—it's a movement. Connect with thousands of women 
                who are looking out for each other, sharing experiences, and making our communities safer.
              </p>
              <p className="text-lg text-stone-600 font-jakarta leading-relaxed">
                Together, we're building a network of support that ensures no woman ever has to feel unsafe or alone.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 md:py-24 bg-primary text-white">
        <div className="max-w-4xl mx-auto px-4 md:px-8 text-center">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-outfit font-bold mb-6">
              Your Safety Starts Here
            </h2>
            <p className="text-lg sm:text-xl mb-10 opacity-90 font-jakarta">
              Join thousands of women who trust SafeHer for their daily safety needs
            </p>
            <Button 
              onClick={handleLogin}
              data-testid="cta-login-button"
              className="h-14 px-10 rounded-full bg-white text-primary hover:bg-stone-100 text-lg font-jakarta font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Start Protecting Yourself Today
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#1C1917] text-white py-8">
        <div className="max-w-7xl mx-auto px-4 md:px-8 text-center">
          <div className="flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 mr-2" />
            <span className="text-2xl font-outfit font-bold">SafeHer</span>
          </div>
          <p className="text-stone-400 font-jakarta">
            Your Guardian in Your Pocket © {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
}