import { K8sMetadataEnricher } from '../k8s-enricher';

describe('K8sMetadataEnricher', () => {
  let enricher: K8sMetadataEnricher;

  beforeEach(() => {
    enricher = new K8sMetadataEnricher();
    // Clear potentially leaky process.env state
    delete process.env.HOSTNAME;
    delete process.env.POD_NAME;
    delete process.env.POD_NAMESPACE;
    delete process.env.NODE_NAME;
    delete process.env.CONTAINER_NAME;
  });

  it('should return empty metadata when not in K8s', () => {
    expect(enricher.isRunningInK8s()).toBe(false);
    expect(enricher.getMetadata()).toEqual({
      podName: undefined,
      namespace: undefined,
      nodeName: undefined,
      containerName: undefined,
      clusterName: undefined,
      podIp: undefined,
    });
  });

  it('should grab metadata from env vars', () => {
    process.env.POD_NAME = 'my-pod-123';
    process.env.POD_NAMESPACE = 'production';
    process.env.NODE_NAME = 'worker-node-1';

    expect(enricher.getMetadata()).toEqual({
      podName: 'my-pod-123',
      namespace: 'production',
      nodeName: 'worker-node-1',
      containerName: undefined,
      clusterName: undefined,
      podIp: undefined,
    });
    expect(enricher.isRunningInK8s()).toBe(true);
  });

  it('should properly format to labels', () => {
    process.env.POD_NAME = 'test-pod';
    process.env.POD_NAMESPACE = 'default';

    expect(enricher.toLabels()).toEqual({
      'k8s.pod.name': 'test-pod',
      'k8s.namespace': 'default',
    });
  });
});
