// This file now re-exports the hook from our context provider
// This maintains API compatibility across the codebase

import { useTranslation } from '@/contexts/TranslationProvider';

export default useTranslation;