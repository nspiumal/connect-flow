import React, { forwardRef, SVGAttributes, memo } from 'react';
import classNames from 'classnames';
import { TColor } from '../../type/color-type';
import { TIcons, TIconsSize } from '../../type/icons-type';
import { iconMap, fallbackIcon } from './iconMap';

const warnedIcons = new Set<string>();

interface IIconProps extends SVGAttributes<SVGSVGElement> {
	icon?: TIcons;
	className?: string;
	color?: TColor;
	size?: TIconsSize;
}
/**
 * Keeps Facit's `<Icon icon='Person' size='lg' color='success' />` API and
 * the `svg-icon svg-icon-{size} text-{color}` classes the SCSS depends on
 * (see styles/components/_svg-icon.scss), but resolves names to lucide-react
 * components via iconMap instead of Facit's generated Material/svg icon set.
 * Renders an <svg> directly (no span wrapper), so the ref points at the SVG.
 */
const Icon = forwardRef<SVGSVGElement, IIconProps>(
	({ icon, className, color, size, ...props }, ref) => {
		if (!icon) return null;

		const LucideIcon = iconMap[icon];

		if (!LucideIcon && import.meta.env.DEV && !warnedIcons.has(icon)) {
			warnedIcons.add(icon);
			// eslint-disable-next-line no-console
			console.warn(`[Icon] No lucide mapping for "${icon}" — add it to vendor/facit/components/icon/iconMap.ts`);
		}

		const Component = LucideIcon ?? fallbackIcon;

		const ClassName = classNames(
			'svg-icon',
			{ [`svg-icon-${size}`]: size, [`text-${color}`]: color },
			className,
		);

		return (
			<Component
				ref={ref}
				data-name={`Icon--${icon}`}
				className={ClassName}
				strokeWidth={1.75}
				aria-hidden="true"
				// eslint-disable-next-line react/jsx-props-no-spreading
				{...props}
			/>
		);
	},
);
Icon.displayName = 'Icon';

export default memo(Icon);
