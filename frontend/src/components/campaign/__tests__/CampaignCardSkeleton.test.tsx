import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { CampaignCardSkeleton, CampaignGridSkeleton } from '../CampaignCardSkeleton';

describe('CampaignCardSkeleton', () => {
  describe('Rendering', () => {
    it('should render skeleton with animation', () => {
      const { container } = render(<CampaignCardSkeleton />);

      const skeleton = container.querySelector('.animate-pulse');
      expect(skeleton).toBeInTheDocument();
    });

    it('should have card styling', () => {
      const { container } = render(<CampaignCardSkeleton />);

      const skeleton = container.firstChild;
      expect(skeleton).toHaveClass('bg-white', 'rounded-xl', 'border', 'border-gray-200', 'p-5', 'shadow-sm');
    });

    it('should fill available height', () => {
      const { container } = render(<CampaignCardSkeleton />);

      const skeleton = container.firstChild;
      expect(skeleton).toHaveClass('h-full');
    });
  });

  describe('Header Skeleton', () => {
    it('should render status badge skeleton', () => {
      const { container } = render(<CampaignCardSkeleton />);

      const badgeSkeleton = container.querySelector('.h-6.w-16.bg-gray-200.rounded-full');
      expect(badgeSkeleton).toBeInTheDocument();
    });

    it('should render campaign name skeleton', () => {
      const { container } = render(<CampaignCardSkeleton />);

      const nameSkeleton = container.querySelector('.h-6.w-3\\/4.bg-gray-200.rounded');
      expect(nameSkeleton).toBeInTheDocument();
    });

    it('should render creator skeleton', () => {
      const { container } = render(<CampaignCardSkeleton />);

      const creatorSkeleton = container.querySelector('.h-4.w-1\\/2.bg-gray-200.rounded');
      expect(creatorSkeleton).toBeInTheDocument();
    });

    it('should have proper spacing in header', () => {
      const { container } = render(<CampaignCardSkeleton />);

      const headerSection = container.querySelector('.space-y-2');
      expect(headerSection).toBeInTheDocument();
    });
  });

  describe('Body Skeleton', () => {
    it('should render description skeleton lines', () => {
      const { container } = render(<CampaignCardSkeleton />);

      const descLines = container.querySelectorAll('.h-4.bg-gray-200.rounded');
      expect(descLines.length).toBeGreaterThanOrEqual(2);
    });

    it('should render statistics skeleton', () => {
      const { container } = render(<CampaignCardSkeleton />);

      const statsSkeletons = container.querySelectorAll('.h-4.w-24.bg-gray-200.rounded');
      expect(statsSkeletons.length).toBe(2);
    });

    it('should have proper spacing in body', () => {
      const { container } = render(<CampaignCardSkeleton />);

      const bodySection = container.querySelector('.mt-3.space-y-3');
      expect(bodySection).toBeInTheDocument();
    });
  });

  describe('Products Preview Skeleton', () => {
    it('should render 4 product preview skeletons', () => {
      const { container } = render(<CampaignCardSkeleton />);

      const productSkeletons = container.querySelectorAll('.w-20.h-16.bg-gray-200.rounded-lg');
      expect(productSkeletons.length).toBe(4);
    });

    it('should arrange products in flex layout', () => {
      const { container } = render(<CampaignCardSkeleton />);

      const productsContainer = container.querySelector('.mt-4.flex.gap-2');
      expect(productsContainer).toBeInTheDocument();
    });
  });

  describe('Footer Skeleton', () => {
    it('should render footer with border', () => {
      const { container } = render(<CampaignCardSkeleton />);

      const footer = container.querySelector('.mt-4.pt-3.border-t.border-gray-100');
      expect(footer).toBeInTheDocument();
    });

    it('should render creation date skeleton', () => {
      const { container } = render(<CampaignCardSkeleton />);

      const dateSkeleton = container.querySelector('.h-4.w-20.bg-gray-200.rounded');
      expect(dateSkeleton).toBeInTheDocument();
    });

    it('should render deadline badge skeleton', () => {
      const { container } = render(<CampaignCardSkeleton />);

      const deadlineSkeleton = container.querySelector('.h-6.w-28.bg-gray-200.rounded-full');
      expect(deadlineSkeleton).toBeInTheDocument();
    });

    it('should arrange footer items with space between', () => {
      const { container } = render(<CampaignCardSkeleton />);

      const footerFlex = container.querySelector('.flex.justify-between');
      expect(footerFlex).toBeInTheDocument();
    });
  });

  describe('Skeleton Colors', () => {
    it('should use gray-200 for all skeleton elements', () => {
      const { container } = render(<CampaignCardSkeleton />);

      const grayElements = container.querySelectorAll('.bg-gray-200');
      expect(grayElements.length).toBeGreaterThan(0);
    });
  });
});

describe('CampaignGridSkeleton', () => {
  describe('Default Behavior', () => {
    it('should render 6 skeletons by default', () => {
      const { container } = render(<CampaignGridSkeleton />);

      const skeletons = container.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBe(6);
    });

    it('should render in grid layout', () => {
      const { container } = render(<CampaignGridSkeleton />);

      const grid = container.querySelector('.grid');
      expect(grid).toBeInTheDocument();
    });

    it('should have responsive grid columns', () => {
      const { container } = render(<CampaignGridSkeleton />);

      const grid = container.querySelector('.grid');
      expect(grid).toHaveClass('grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3');
    });

    it('should have proper gap between items', () => {
      const { container } = render(<CampaignGridSkeleton />);

      const grid = container.querySelector('.grid');
      expect(grid).toHaveClass('gap-6');
    });
  });

  describe('Custom Count', () => {
    it('should render custom number of skeletons', () => {
      const { container } = render(<CampaignGridSkeleton count={3} />);

      const skeletons = container.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBe(3);
    });

    it('should render 12 skeletons when specified', () => {
      const { container } = render(<CampaignGridSkeleton count={12} />);

      const skeletons = container.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBe(12);
    });

    it('should render 1 skeleton when specified', () => {
      const { container } = render(<CampaignGridSkeleton count={1} />);

      const skeletons = container.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBe(1);
    });
  });

  describe('Responsive Design', () => {
    it('should maintain mobile-first approach', () => {
      const { container } = render(<CampaignGridSkeleton />);

      const grid = container.querySelector('.grid');
      // Should start with single column
      expect(grid).toHaveClass('grid-cols-1');
    });

    it('should expand to 2 columns on medium screens', () => {
      const { container } = render(<CampaignGridSkeleton />);

      const grid = container.querySelector('.grid');
      expect(grid).toHaveClass('md:grid-cols-2');
    });

    it('should expand to 3 columns on large screens', () => {
      const { container } = render(<CampaignGridSkeleton />);

      const grid = container.querySelector('.grid');
      expect(grid).toHaveClass('lg:grid-cols-3');
    });
  });

  describe('Skeleton Structure', () => {
    it('should render all skeleton items with consistent structure', () => {
      const { container } = render(<CampaignGridSkeleton count={3} />);

      const skeletons = container.querySelectorAll('.animate-pulse');

      skeletons.forEach(skeleton => {
        expect(skeleton).toHaveClass('bg-white', 'rounded-xl', 'border');
      });
    });
  });

  describe('Performance', () => {
    it('should efficiently render large number of skeletons', () => {
      const { container } = render(<CampaignGridSkeleton count={50} />);

      const skeletons = container.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBe(50);
    });

    it('should render zero skeletons when count is 0', () => {
      const { container } = render(<CampaignGridSkeleton count={0} />);

      const skeletons = container.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBe(0);
    });
  });
});
