import * as fs from 'fs';
import * as path from 'path';

/**
 * Kubernetes metadata gathered from the Downward API.
 */
export interface K8sMetadata {
  podName?: string;
  namespace?: string;
  nodeName?: string;
  containerName?: string;
  clusterName?: string;
  podIp?: string;
}

/**
 * K8sMetadataEnricher reads Kubernetes Downward API environment
 * variables and file mounts to enrich telemetry with cluster context.
 *
 * Gracefully returns empty metadata when not running inside K8s.
 */
export class K8sMetadataEnricher {
  private cached: K8sMetadata | null = null;

  /** Read and cache K8s metadata. */
  getMetadata(): K8sMetadata {
    if (this.cached) return this.cached;

    this.cached = {
      podName: this.readEnv('HOSTNAME') ?? this.readEnv('POD_NAME'),
      namespace: this.readFile('/var/run/secrets/kubernetes.io/serviceaccount/namespace')
        ?? this.readEnv('POD_NAMESPACE'),
      nodeName: this.readEnv('NODE_NAME'),
      containerName: this.readEnv('CONTAINER_NAME'),
      clusterName: this.readEnv('CLUSTER_NAME'),
      podIp: this.readEnv('POD_IP'),
    };

    return this.cached;
  }

  /** Returns true if we appear to be running in a K8s pod. */
  isRunningInK8s(): boolean {
    const meta = this.getMetadata();
    return !!(meta.namespace || this.fileExists('/var/run/secrets/kubernetes.io/serviceaccount/token'));
  }

  /** Returns metadata as a flat labels object for telemetry tagging. */
  toLabels(): Record<string, string> {
    const meta = this.getMetadata();
    const labels: Record<string, string> = {};
    if (meta.podName) labels['k8s.pod.name'] = meta.podName;
    if (meta.namespace) labels['k8s.namespace'] = meta.namespace;
    if (meta.nodeName) labels['k8s.node.name'] = meta.nodeName;
    if (meta.containerName) labels['k8s.container.name'] = meta.containerName;
    if (meta.clusterName) labels['k8s.cluster.name'] = meta.clusterName;
    if (meta.podIp) labels['k8s.pod.ip'] = meta.podIp;
    return labels;
  }

  /** Reset cached metadata (useful for testing). */
  reset(): void {
    this.cached = null;
  }

  private readEnv(key: string): string | undefined {
    return process.env[key] || undefined;
  }

  private readFile(filePath: string): string | undefined {
    try {
      return fs.readFileSync(filePath, 'utf-8').trim() || undefined;
    } catch {
      return undefined;
    }
  }

  private fileExists(filePath: string): boolean {
    try {
      fs.accessSync(filePath);
      return true;
    } catch {
      return false;
    }
  }
}
