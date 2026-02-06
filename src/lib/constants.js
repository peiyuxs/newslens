/**
 * CSS animations and constants
 */

export const ANIMATIONS_STYLES = `
  @keyframes fadeUpSlide {
    from {
      opacity: 0;
      transform: translateY(40px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  @keyframes slideUp {
    from {
      opacity: 1;
      transform: translateY(0);
    }
    to {
      opacity: 0;
      transform: translateY(-100vh);
    }
  }
  @keyframes slideDown {
    from {
      transform: translateY(-100px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
  .animate-fade-up {
    animation: fadeUpSlide 0.8s ease-out;
  }
  .animate-fade-up-delay-1 {
    animation: fadeUpSlide 0.8s ease-out 0.2s both;
  }
  .animate-fade-up-delay-2 {
    animation: fadeUpSlide 0.8s ease-out 0.4s both;
  }
  .animate-slide-up-exit {
    animation: slideUp 0.5s ease-in forwards;
  }
  .animate-slide-down-enter {
    animation: slideDown 0.6s ease-out forwards;
  }
  .animate-fade-in-enter {
    animation: fadeIn 0.8s ease-out 0.3s forwards;
  }
`;
