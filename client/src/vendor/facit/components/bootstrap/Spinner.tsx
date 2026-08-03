import React, { forwardRef, ReactNode } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import TagWrapper from '../TagWrapper';
import { TColor } from '../../type/color-type';

interface ISpinnerProps {
	children?: ReactNode;
	tag?: 'div' | 'span';
	color?: TColor | null;
	isGrow?: boolean;
	isSmall?: boolean;
	size?: string | number | null;
	inButton?: boolean | 'onlyIcon';
	className?: string;
	style?: React.CSSProperties;
}
const Spinner = forwardRef<HTMLDivElement, ISpinnerProps>(
	({ tag, color, isGrow, isSmall, size, children, inButton, className, style, ...props }, ref) => {
		const HIDDEN_TEXT = <span className='visually-hidden'>{children}</span>;
		return (
			<>
				<TagWrapper
					ref={ref}
					tag={inButton ? 'span' : tag}
					className={classNames(
						{ 'spinner-border': !isGrow, 'spinner-grow': isGrow },
						{
							'spinner-border-sm': !isGrow && isSmall,
							'spinner-grow-sm': isGrow && isSmall,
						},
						{ [`text-${color}`]: color },
						{ 'me-2': inButton !== 'onlyIcon' && !!inButton },
						className,
					)}
					style={size ? { height: size, width: size, ...style } : style}
					role='status'
					aria-hidden={inButton ? 'true' : null}
					// eslint-disable-next-line react/jsx-props-no-spreading
					{...props}>
					{inButton !== 'onlyIcon' && !!inButton ? HIDDEN_TEXT : ''}
				</TagWrapper>
				{inButton === 'onlyIcon' ? HIDDEN_TEXT : null}
			</>
		);
	},
);
Spinner.displayName = 'Spinner';
Spinner.propTypes = {
	children: PropTypes.node,
	tag: PropTypes.oneOf(['div', 'span']),
	color: PropTypes.oneOf([
		'primary',
		'secondary',
		'success',
		'info',
		'warning',
		'danger',
		'light',
		'dark',
	]),
	isGrow: PropTypes.bool,
	isSmall: PropTypes.bool,
	size: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
	// @ts-ignore
	inButton: PropTypes.oneOfType([PropTypes.bool, PropTypes.oneOf(['onlyIcon'])]),
	className: PropTypes.string,
};
Spinner.defaultProps = {
	children: 'Loading...',
	tag: 'div',
	color: null,
	isGrow: false,
	isSmall: false,
	size: null,
	inButton: false,
	className: undefined,
};

export default Spinner;
