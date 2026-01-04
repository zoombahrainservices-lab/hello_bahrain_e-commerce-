// Server component wrapper - ensures Next.js recognizes this as a page route
import BenefitResponseClient from './BenefitResponseClient';

export default function BenefitResponsePage() {
  return <BenefitResponseClient />;
}
