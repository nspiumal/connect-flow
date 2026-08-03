import React, { useLayoutEffect, forwardRef, ReactElement } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { ISubHeaderProps } from '../SubHeader/SubHeader';
import { IPageProps } from '../Page/Page';

const SITE_NAME = 'Kalyani House of Jewellers';

interface IPageWrapperProps {
	isProtected?: boolean;
	title?: string;
	description?: string;
	children:
		| ReactElement<ISubHeaderProps>[]
		| ReactElement<IPageProps>
		| ReactElement<IPageProps>[];
	className?: string;
}
// Auth/permission gating for protected pages is handled by AppLayout + RequirePermission
// (see client/src/components/layout/AppLayout.tsx) before this component ever renders,
// so `isProtected` here only exists for prop-shape compatibility with Facit page code.
const PageWrapper = forwardRef<HTMLDivElement, IPageWrapperProps>(
	({ title, description, className, children }, ref) => {
		useLayoutEffect(() => {
			document.title = `${title ? `${title} | ` : ''}${SITE_NAME}`;
			document
				?.querySelector('meta[name="description"]')
				?.setAttribute('content', description || SITE_NAME);
		});

		return (
			<div ref={ref} className={classNames('page-wrapper', 'container-fluid', className)}>
				{children}
			</div>
		);
	},
);
PageWrapper.displayName = 'PageWrapper';
PageWrapper.propTypes = {
	isProtected: PropTypes.bool,
	title: PropTypes.string,
	description: PropTypes.string,
	// @ts-ignore
	children: PropTypes.node.isRequired,
	className: PropTypes.string,
};
PageWrapper.defaultProps = {
	isProtected: true,
	title: undefined,
	description: undefined,
	className: undefined,
} as Partial<IPageWrapperProps>;

export default PageWrapper;
