# Build Docker images

**NOTE**: Kubernetes does *not* build Docker images for you. Before deploying for the first time, or if you make any changes to your code, you *must* (re-)run the commands below to regenerate the images, and then re-deploy to Kubernetes.

## Server
```bash
cd server
docker build -t lecture19-smoothie-stand-server .
cd ..
```

## UI (NGINX)
```bash
cd ui
docker build -t competitive-connections-ui .
cd ..
```

# Deploy on Kubernetes

```bash
kubectl create -f k8s/
```

# Undeploy

Undeploy before re-deploying if you make a change to the app. Also remember to rebuild Docker images per the instructions earlier in this README.

```bash
kubectl delete -f k8s/
```

# Do one-time Mongo setup

In one terminal:

```bash
kubectl port-forward service/db 27017:27017
```

In another terminal:

```bash
cd server
npm run setup
```


