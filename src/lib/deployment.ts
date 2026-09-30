/** How each deployment state is named on the page. One wording everywhere. */
export const deploymentLabel = {
  production: 'In production',
  delivered: 'Delivered',
  prototype: 'Prototype',
} as const;

export type DeploymentState = keyof typeof deploymentLabel;
