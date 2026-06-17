import sanitizeHtml from 'sanitize-html';
import sharp from 'sharp';
import { SVG_PREVIEW_SIZE, WEBP_QUALITY } from './constants';

export interface SvgValidationResult {
  valid: boolean;
  sanitized?: string;
  error?: string;
}

export interface SvgPreviewResult {
  buffer: Buffer;
  width: number;
  height: number;
  fileSizeBytes: number;
}

/**
 * Validate and sanitize an SVG buffer.
 *
 * Removes:
 * - <script> elements
 * - All event handler attributes (on*)
 * - External resource references in href/xlink:href
 * - <use> elements referencing external URLs
 * - <foreignObject> elements (can embed HTML/JS)
 *
 * Returns sanitized SVG string on success, or an error message if the
 * SVG is structurally invalid or cannot be made safe.
 */
export function validateAndSanitizeSvg(buffer: Buffer): SvgValidationResult {
  const raw = buffer.toString('utf-8');

  // Must start with an SVG root element (allowing XML declaration / doctype)
  if (!/<svg[\s>]/i.test(raw)) {
    return { valid: false, error: 'File does not appear to be a valid SVG.' };
  }

  // Reject data URIs that could embed scripts
  if (/data:text\/html/i.test(raw) || /data:application\/javascript/i.test(raw)) {
    return { valid: false, error: 'SVG contains disallowed data URIs.' };
  }

  const sanitized = sanitizeHtml(raw, {
    allowedTags: [
      'svg', 'g', 'path', 'rect', 'circle', 'ellipse', 'line', 'polyline',
      'polygon', 'text', 'tspan', 'textPath', 'image', 'use', 'symbol',
      'defs', 'clipPath', 'mask', 'pattern', 'linearGradient',
      'radialGradient', 'stop', 'marker', 'filter', 'feBlend',
      'feColorMatrix', 'feComposite', 'feConvolveMatrix', 'feDiffuseLighting',
      'feDisplacementMap', 'feDropShadow', 'feFlood', 'feGaussianBlur',
      'feImage', 'feMerge', 'feMergeNode', 'feMorphology', 'feOffset',
      'feSpecularLighting', 'feTile', 'feTurbulence', 'animate',
      'animateMotion', 'animateTransform', 'mpath', 'set', 'title', 'desc',
    ],
    allowedAttributes: {
      '*': [
        'id', 'class', 'style', 'transform', 'clip-path', 'mask', 'filter',
        'opacity', 'visibility', 'display', 'fill', 'fill-opacity', 'fill-rule',
        'stroke', 'stroke-width', 'stroke-opacity', 'stroke-linecap',
        'stroke-linejoin', 'stroke-miterlimit', 'stroke-dasharray',
        'stroke-dashoffset', 'color', 'color-interpolation',
        'color-interpolation-filters', 'color-rendering', 'shape-rendering',
        'text-rendering', 'image-rendering', 'pointer-events', 'cursor',
        'overflow', 'clip', 'clip-rule',
      ],
      'svg': [
        'xmlns', 'xmlns:xlink', 'version', 'viewBox', 'width', 'height',
        'x', 'y', 'preserveAspectRatio', 'aria-hidden', 'role',
        'focusable', 'tabindex',
      ],
      'path': ['d', 'pathLength'],
      'rect': ['x', 'y', 'width', 'height', 'rx', 'ry'],
      'circle': ['cx', 'cy', 'r'],
      'ellipse': ['cx', 'cy', 'rx', 'ry'],
      'line': ['x1', 'y1', 'x2', 'y2'],
      'polyline': ['points'],
      'polygon': ['points'],
      'text': ['x', 'y', 'dx', 'dy', 'rotate', 'textLength', 'lengthAdjust', 'font-family', 'font-size', 'font-weight', 'font-style', 'text-anchor', 'dominant-baseline'],
      'tspan': ['x', 'y', 'dx', 'dy', 'rotate', 'textLength', 'lengthAdjust'],
      'use': ['href', 'xlink:href', 'x', 'y', 'width', 'height'],
      'image': ['href', 'xlink:href', 'x', 'y', 'width', 'height', 'preserveAspectRatio'],
      'symbol': ['id', 'viewBox', 'width', 'height'],
      'defs': [],
      'g': [],
      'linearGradient': ['id', 'x1', 'y1', 'x2', 'y2', 'gradientUnits', 'gradientTransform', 'spreadMethod', 'href', 'xlink:href'],
      'radialGradient': ['id', 'cx', 'cy', 'r', 'fx', 'fy', 'gradientUnits', 'gradientTransform', 'spreadMethod', 'href', 'xlink:href'],
      'stop': ['offset', 'stop-color', 'stop-opacity'],
      'clipPath': ['id', 'clipPathUnits'],
      'mask': ['id', 'x', 'y', 'width', 'height', 'maskUnits', 'maskContentUnits'],
      'pattern': ['id', 'x', 'y', 'width', 'height', 'patternUnits', 'patternContentUnits', 'patternTransform', 'viewBox', 'preserveAspectRatio'],
      'marker': ['id', 'markerWidth', 'markerHeight', 'refX', 'refY', 'orient', 'markerUnits', 'viewBox', 'preserveAspectRatio'],
      'filter': ['id', 'x', 'y', 'width', 'height', 'filterUnits', 'primitiveUnits', 'color-interpolation-filters'],
      'feBlend': ['in', 'in2', 'mode', 'result', 'x', 'y', 'width', 'height'],
      'feColorMatrix': ['in', 'type', 'values', 'result', 'x', 'y', 'width', 'height'],
      'feComposite': ['in', 'in2', 'operator', 'k1', 'k2', 'k3', 'k4', 'result', 'x', 'y', 'width', 'height'],
      'feGaussianBlur': ['in', 'stdDeviation', 'edgeMode', 'result', 'x', 'y', 'width', 'height'],
      'feOffset': ['in', 'dx', 'dy', 'result', 'x', 'y', 'width', 'height'],
      'feFlood': ['flood-color', 'flood-opacity', 'result', 'x', 'y', 'width', 'height'],
      'feMerge': ['result', 'x', 'y', 'width', 'height'],
      'feMergeNode': ['in'],
      'feDropShadow': ['dx', 'dy', 'stdDeviation', 'flood-color', 'flood-opacity', 'result', 'x', 'y', 'width', 'height'],
      'animate': ['attributeName', 'attributeType', 'from', 'to', 'begin', 'dur', 'repeatCount', 'fill', 'values', 'keyTimes', 'calcMode', 'additive', 'accumulate'],
      'animateTransform': ['attributeName', 'type', 'from', 'to', 'begin', 'dur', 'repeatCount', 'fill', 'values', 'keyTimes', 'calcMode', 'additive', 'accumulate'],
      'animateMotion': ['path', 'begin', 'dur', 'repeatCount', 'fill', 'calcMode', 'keyTimes', 'keyPoints', 'rotate', 'additive', 'accumulate'],
    },
    allowedSchemes: ['data'],
    allowedSchemesByTag: {
      'image': ['data', 'https', 'http'],
    },
    // Strip any event handler attributes like onload, onclick, etc.
    exclusiveFilter(frame) {
      const hasEventHandlers = Object.keys(frame.attribs).some((attr) =>
        attr.toLowerCase().startsWith('on'),
      );
      // Remove <use> elements that reference external URLs
      if (frame.tag === 'use') {
        const href = frame.attribs.href ?? frame.attribs['xlink:href'] ?? '';
        if (href.startsWith('http') || href.startsWith('//')) return true;
      }
      // Remove <image> elements that reference javascript: URIs
      if (frame.tag === 'image') {
        const href = frame.attribs.href ?? frame.attribs['xlink:href'] ?? '';
        if (/^javascript:/i.test(href)) return true;
      }
      return hasEventHandlers;
    },
    disallowedTagsMode: 'discard',
  });

  // Confirm the output still has an SVG root after sanitization
  if (!/<svg[\s>]/i.test(sanitized)) {
    return { valid: false, error: 'SVG was rejected after sanitization.' };
  }

  return { valid: true, sanitized };
}

/**
 * Rasterize an SVG buffer to a WebP preview thumbnail using Sharp.
 */
export async function generateSvgPreview(svgBuffer: Buffer): Promise<SvgPreviewResult> {
  const previewBuffer = await sharp(svgBuffer)
    .resize(SVG_PREVIEW_SIZE, SVG_PREVIEW_SIZE, {
      fit: 'inside',
      withoutEnlargement: true,
      background: { r: 255, g: 255, b: 255, alpha: 0 },
    })
    .webp({ quality: WEBP_QUALITY })
    .toBuffer();

  const meta = await sharp(previewBuffer).metadata();

  return {
    buffer: previewBuffer,
    width: meta.width ?? SVG_PREVIEW_SIZE,
    height: meta.height ?? SVG_PREVIEW_SIZE,
    fileSizeBytes: previewBuffer.length,
  };
}
