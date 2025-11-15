// Marketing landing page

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './LandingPage.module.css';

const USER_ID_KEY = 'teamUpdatesUserId';

export function LandingPage() {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to teams if user already has a profile
    const userId = localStorage.getItem(USER_ID_KEY);
    if (userId) {
      navigate('/teams');
    }
  }, [navigate]);

  const handleGetStarted = () => {
    navigate('/profile/new');
  };

  return (
    <div className={styles.landing}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles['hero-content']}>
          <h1 className={styles['hero-title']}>
            Stay in Sync with Your Team's Daily Pulse
          </h1>
          <p className={styles['hero-subtitle']}>
            Share updates with voice, video, and location. See what matters on a timeline or map view.
          </p>
          <button onClick={handleGetStarted} className={styles['cta-button']}>
            Create Profile & Join a Team
          </button>
        </div>
        <div className={styles['hero-visual']}>
          <div className={styles['feature-preview']}>
            <div className={styles['preview-card']}>
              <span className={styles['preview-icon']}>📍</span>
              <span>Location Updates</span>
            </div>
            <div className={styles['preview-card']}>
              <span className={styles['preview-icon']}>🎤</span>
              <span>Voice Messages</span>
            </div>
            <div className={styles['preview-card']}>
              <span className={styles['preview-icon']}>🗺️</span>
              <span>Map View</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className={styles.features}>
        <h2 className={styles['section-title']}>Everything You Need to Stay Connected</h2>
        <div className={styles['features-grid']}>
          <div className={styles['feature-card']}>
            <div className={styles['feature-icon']}>📍</div>
            <h3 className={styles['feature-title']}>Location-Aware Updates</h3>
            <p className={styles['feature-description']}>
              Share where you are with privacy-first randomized locations. Your exact location stays private.
            </p>
          </div>
          <div className={styles['feature-card']}>
            <div className={styles['feature-icon']}>🎤</div>
            <h3 className={styles['feature-title']}>Voice & Video Support</h3>
            <p className={styles['feature-description']}>
              Record voice messages or share photos and videos. Express yourself beyond text.
            </p>
          </div>
          <div className={styles['feature-card']}>
            <div className={styles['feature-icon']}>🗺️</div>
            <h3 className={styles['feature-title']}>Interactive Map View</h3>
            <p className={styles['feature-description']}>
              See where your team is posting from with our interactive map view. Location markers bring context to updates.
            </p>
          </div>
          <div className={styles['feature-card']}>
            <div className={styles['feature-icon']}>🔒</div>
            <h3 className={styles['feature-title']}>Privacy-First Design</h3>
            <p className={styles['feature-description']}>
              Locations are automatically randomized to protect your privacy. You control how much precision to share.
            </p>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className={styles.benefits}>
        <h2 className={styles['section-title']}>Built for Async Team Transparency</h2>
        <div className={styles['benefits-grid']}>
          <div className={styles['benefit-item']}>
            <h3>🌐 Work From Anywhere</h3>
            <p>Keep your team in sync whether you're in the office, remote, or on the go.</p>
          </div>
          <div className={styles['benefit-item']}>
            <h3>💬 Rich Context</h3>
            <p>Share more than text - add voice, photos, videos, and location to provide full context.</p>
          </div>
          <div className={styles['benefit-item']}>
            <h3>⚡ Flexible Sharing</h3>
            <p>Post wins, blockers, team updates, or life moments. Choose what fits the moment.</p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className={styles['final-cta']}>
        <h2>Ready to Get Started?</h2>
        <p>Create your profile and join your team in seconds.</p>
        <button onClick={handleGetStarted} className={styles['cta-button']}>
          Create Profile & Join a Team
        </button>
      </section>
    </div>
  );
}
