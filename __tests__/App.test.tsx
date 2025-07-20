/**
 * @format
 */
import React from 'react';

import ReactTestRenderer from 'react-test-renderer';

import App from '../App';

describe('App', () => {
  it('renders correctly', async () => {
    await ReactTestRenderer.act(() => {
      const renderer = ReactTestRenderer.create(<App />);
      expect(renderer).toBeTruthy();
    });
  });
});
