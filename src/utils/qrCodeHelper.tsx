/**
 * qrCodeHelper.tsx — Ultra-fast, zero-dependency SVG QR Code Generator
 *
 * Uses 'toqr' (pure JS micro-encoder) and 'react-native-svg' to render
 * sharp, scalable vector QR codes without any native C++ or camera dependencies.
 */

import React, { useMemo } from 'react';
import Svg, { Path, Rect } from 'react-native-svg';
import { toQR } from 'toqr';

export interface QRCodeSvgProps {
  value: string;
  size?: number;
  color?: string;
  backgroundColor?: string;
  padding?: number;
}

export interface QRMatrixResult {
  gridSize: number;
  path: string;
}

/**
 * Encodes text/URL into a vector SVG path
 */
export function generateQRMatrix(value: string): QRMatrixResult {
  if (!value || value.trim().length === 0) {
    return { gridSize: 21, path: '' };
  }

  try {
    const raw = toQR(value);
    const gridSize = Math.round(Math.sqrt(raw.length));
    let path = '';

    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        if (raw[y * gridSize + x]) {
          path += `M${x},${y}h1v1h-1z `;
        }
      }
    }

    return { gridSize, path };
  } catch (err) {
    console.warn('Failed to encode QR code:', err);
    return { gridSize: 21, path: '' };
  }
}

/**
 * Pure SVG QR Code View for React Native
 */
export const QRCodeSvg: React.FC<QRCodeSvgProps> = ({
  value,
  size = 200,
  color = '#000000',
  backgroundColor = '#FFFFFF',
  padding = 2,
}) => {
  const { gridSize, path } = useMemo(() => generateQRMatrix(value), [value]);
  const totalViewSize = gridSize + padding * 2;

  return (
    <Svg
      width={size}
      height={size}
      viewBox={`-${padding} -${padding} ${totalViewSize} ${totalViewSize}`}
      style={{ borderRadius: 16, overflow: 'hidden' }}
    >
      {/* Background container */}
      <Rect
        x={-padding}
        y={-padding}
        width={totalViewSize}
        height={totalViewSize}
        fill={backgroundColor}
        rx={1}
      />
      {/* Data Path */}
      {path.length > 0 && <Path d={path} fill={color} fillRule='evenodd' />}
    </Svg>
  );
};

export default QRCodeSvg;
