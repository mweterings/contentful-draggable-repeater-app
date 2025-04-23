import { useMemo } from 'react';
import { locations, FieldAppSDK } from '@contentful/app-sdk';
import Field from './locations/Field';
import { useSDK } from '@contentful/react-apps-toolkit';

const ComponentLocationSettings = {
  [locations.LOCATION_ENTRY_FIELD]: Field,
};

const App = () => {
  const sdk = useSDK<FieldAppSDK>();

  const Component = useMemo(() => {
    for (const [location, component] of Object.entries(ComponentLocationSettings)) {
      if (sdk.location.is(location)) {
        return component;
      }
    }
    return null;
  }, [sdk.location]);

  return Component ? <Component sdk={sdk} /> : null;
};

export default App;
