# Kubernetes Demo

These manifests show the EMS application running on Kubernetes with PostgreSQL,
backend, frontend, Prometheus, and Grafana.

For a demo cluster such as Docker Desktop Kubernetes or Minikube:

```powershell
kubectl apply -f K8s/namespace.yaml
kubectl apply -f K8s/configmap.yaml
kubectl apply -f K8s/secret.example.yaml
kubectl apply -f K8s/postgres.yaml
kubectl apply -f K8s/backend.yaml
kubectl apply -f K8s/frontend.yaml
kubectl apply -f K8s/prometheus.yaml
kubectl apply -f K8s/grafana.yaml

kubectl get all -n ems
```

For local access if LoadBalancer does not assign an external IP:

```powershell
kubectl port-forward svc/ems-frontend 8080:8080 -n ems
kubectl port-forward svc/prometheus 9090:9090 -n ems
kubectl port-forward svc/grafana 3001:3000 -n ems
```
