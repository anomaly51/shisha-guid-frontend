import { AppRoutes } from '../../src/app/routes'
import '../../src/shared/i18n'
import { NavigationProgress } from '../../src/widgets/NavigationProgress'

export const Page = () => (
  <>
    <NavigationProgress />
    <AppRoutes />
  </>
)
