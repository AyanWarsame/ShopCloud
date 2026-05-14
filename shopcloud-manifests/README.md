# ShopCloud GitOps Manifests

This directory contains sample Kubernetes manifests and a Kustomize overlay for the ShopCloud app.

## Structure

- `base/` - shared deployment and service definitions for backend and frontend
- `envs/dev/` - dev overlay with namespace and image override stubs
- `envs/staging/` - staging overlay
- `envs/prod/` - prod overlay

## How to use

1. Store this repo in a GitOps repository such as `shopcloud-manifests`.
2. Have ArgoCD point at `envs/dev`, `envs/staging`, and `envs/prod`.
3. The CI pipeline should update `images.newName` and `images.newTag` in `envs/dev/kustomization.yaml` after each successful build.
4. Use Kargo to promote image tags from dev to staging and prod when ready.
