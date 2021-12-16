# Deployments

For a complete list of Sourcegraph instances we manage, see our [instances documentation](instances.md).

- [Deployments](#deployments)
  - [Deployment basics](#deployment-basics)
    - [Images](#images)
    - [Renovate](#renovate)
    - [ArgoCD](#argocd)
    - [Infrastructure](#infrastructure)
  - [deploy-sourcegraph](#deploy-sourcegraph)
    - [Merging changes from deploy-sourcegraph](#merging-changes-from-deploy-sourcegraph)
  - [Relationship between deploy-sourcegraph repositories](#relationship-between-deploy-sourcegraph-repositories)
    - [Merging upstream `deploy-sourcegraph` into `deploy-sourcegraph-cloud`](#merging-upstream-deploy-sourcegraph-into-deploy-sourcegraph-cloud)

Additional resources:

- [Playbooks](./playbooks.md)
- [Azure DevOps](./azure_devops.md)
- [RPO & RTO](./rto_rpo.md)
- [Testing](./testing.md)
- [Security](./security.md)

## Deployment basics

Changes to [the main `sourcegraph/sourcegraph` repository](https://github.com/sourcegraph/sourcegraph) are automatically built as [images](#images).

- [Sourcegraph Cloud](instances.md#sourcegraph-cloud) will eventually pick up the same changes on a schedule via [Renovate](#renovate)
- [k8s.sgdev.org](instances.md#k8s-sgdev-org) will deploy the changes via [ArgoCD](#argocd)

### Images

Each Sourcegraph service is provided as a Docker image. Every commit to `main` in [sourcegraph/sourcegraph](https://github.com/sourcegraph/sourcegraph) pushes updated Docker images for all of our services to [Docker Hub](https://hub.docker.com/u/sourcegraph/) as part of our [CI pipeline](https://buildkite.com/sourcegraph/sourcegraph) (i.e. if CI is green, then Docker images have been pushed). Images are first built as "candidate" images that are pushed to GCR to with the tag format `<commit-hash>_<build-number>_candidate`. The pipeline then runs a series of tests and checks against the images. If all pipeline steps pass the images are "promoted" and pushed to DockerHub with the tag format `<build-number>_<date>_<commit-hash>`. These are used by [Sourcegraph Cloud](instances.md#sourcegraph-cloud).

When [a new semver release](../releases/index.md) is cut the pipelines, will build a release image with the same tag as the latest [release version](https://github.com/sourcegraph/sourcegraph/tags) as well. These are used by customer deployments.

For pushing custom images, refer to [building Docker images for specific branches](#building-docker-images-for-a-specific-branch).

### Renovate

Renovate is a tool for updating dependencies. [`deploy-sourcegraph-*`](#deploy-sourcegraph) repositories with Renovate configured check for updated Docker images about every hour. If it finds new Docker images then it opens and merges a PR ([Sourcegraph.com example](https://github.com/sourcegraph/deploy-sourcegraph-cloud/pulls?utf8=%E2%9C%93&q=is%3Apr+author%3Aapp%2Frenovate)) to update the image tags in the deployment configuration. This is usually accompanied by a CI job that deploys the updated images to the appropriate deployment.

Renovate configurations are committed in their respective [`deploy-sourcegraph-*`](#deploy-sourcegraph) repositories as `renovate.json5`.

### ArgoCD

ArgoCD is a continuous delivery tool for Kubernetes applications.
Sourcegraph's ArgoCD instance is available at [argocd.sgdev.org](https://argocd.sgdev.org/).

ArgoCD currently handles deployments for [k8s.sgdev.org](instances.md#k8s-sgdev-org).

### Infrastructure

The cloud resources (including clusters, DNS configuration, etc.) on which are deployments run should be configured in the [infrastructure repository](https://github.com/sourcegraph/infrastructure), even though Kubernetes deployments are managed by various `deploy-sourcegraph-*` repositories. For information about how our infrastructure is organized, refer to [Infrastructure](../../tools/infrastructure/index.md).

## deploy-sourcegraph

Sourcegraph Kubernetes deployments typically start off as [deploy-sourcegraph](https://github.com/sourcegraph/deploy-sourcegraph) forks. Learn more about how we advise customers to deploy Sourcegraph in Kubernetes in our [admin installation documentation](https://docs.sourcegraph.com/admin/install/kubernetes).

There is automation in place to drive automatic updates for certain deployments from `deploy-sourcegraph`:

- [`deploy-sourcegraph-cloud`](https://github.com/sourcegraph/deploy-sourcegraph-cloud) utilizies an [Buildkite pipeline](https://github.com/sourcegraph/deploy-sourcegraph-cloud/blob/release/.buildkite/pipeline.yaml#L27:L33) to deploy applications automatically. On commits, including those from Renovate, this pipeline runs [`kubectl-apply-all.sh`](https://github.com/sourcegraph/deploy-sourcegraph-cloud/blob/release/kubectl-apply-all.sh) roll out the new images.

For documentation about developing `deploy-sourcegraph` and cutting releases, refer to the [repository's `README.dev.md`](https://github.com/sourcegraph/deploy-sourcegraph/blob/master/README.dev.md).

### Merging changes from [deploy-sourcegraph](https://github.com/sourcegraph/deploy-sourcegraph)

We have two Sourcegraph Kubernetes cluster installations that we manage ourselves:

- [deploy-sourcegraph-cloud](https://github.com/sourcegraph/deploy-sourcegraph-cloud)
- [deploy-sourcegraph-dogfood-k8s-2](https://github.com/sourcegraph/deploy-sourcegraph-dogfood-k8s-2)

This section describes how to merge changes from [deploy-sourcegraph](https://github.com/sourcegraph/deploy-sourcegraph)
(referred to as upstream) into `deploy-sourcegraph-cloud`. The `deploy-sourcegraph-dogfood-k8s-2` configuration is [automatically updated with the latest `deploy-sourcegraph` changes](instances.md#k8s-sgdev-org).

The process is similar to the [process](https://docs.sourcegraph.com/admin/install/kubernetes/configure#fork-this-repository)
we recommend our customers use to merge changes from upstream. The differences in process originate from the dual purpose
of these two installations: they are genuine installations used by us and outside users (in the case of dot-com) and in addition
to that they are test installations for new changes in code and in deployment. For that reason they are not pinned down to a version
and the docker images are automatically updated to the latest builds.

> Note: What is said about `deploy-sourcegraph-cloud` also applies to `deploy-sourcegraph-dogfood-k8s` unless otherwise specified.

## Relationship between deploy-sourcegraph repositories

1. [`deploy-sourcegraph-cloud@master`](https://github.com/sourcegraph/deploy-sourcegraph-cloud/tree/master) strictly tracks the upstream https://github.com/sourcegraph/deploy-sourcegraph/tree/master.
1. [`deploy-sourcegraph-cloud@release`](https://github.com/sourcegraph/deploy-sourcegraph-cloud/tree/release) _only_ contains the customizations required to deploy/document sourcegraph.com from the base deployment of Sourcegraph.
   - This is the default branch for this repository, since all customizations to sourcegraph.com should be merged into this branch (like we tell our customers to).

These steps ensure that the diff between [deploy-sourcegraph-cloud](https://github.com/sourcegraph/deploy-sourcegraph-cloud) and [deploy-sourcegraph](https://github.com/sourcegraph/deploy-sourcegraph) is as small as possible so that the changes are easy to review.

In order to mimic the same workflow that we tell our customers to follow:

- Customizations / documentation changes that **apply to all customers (not just sourcegraph.com)** should be:

  1. Merged into [`deploy-sourcegraph@master`](https://github.com/sourcegraph/deploy-sourcegraph/tree/master) (note that this will also [automatically update k8s.sgdev.org](instances.md#k8s-sgdev-org))
  1. Pulled into [`deploy-sourcegraph-cloud@master`](https://github.com/sourcegraph/deploy-sourcegraph-cloud/tree/master):
  <pre>
  git checkout master
  git fetch upstream
  git merge upstream/master
  </pre>

  1. Merged into [`deploy-sourcegraph-cloud@release`](https://github.com/sourcegraph/deploy-sourcegraph-cloud/tree/release) by merging from[`deploy-sourcegraph-cloud@master`](https://github.com/sourcegraph/deploy-sourcegraph-cloud/tree/master)—see [merging upstream](#merging-upstream-deploy-sourcegraph-into-deploy-sourcegraph-cloud) for more details.

- Customizations / documentation changes that **apply to only sourcegraph.com** can be simply merged into the [`deploy-sourcegraph-cloud@release`](https://github.com/sourcegraph/deploy-sourcegraph-cloud/tree/release) branch.

### Merging upstream `deploy-sourcegraph` into `deploy-sourcegraph-cloud`

1. Clone this repository and `cd` into it.
1. If you have not already, `git remote add upstream https://github.com/sourcegraph/deploy-sourcegraph`
1. `git checkout master && git pull upstream/master`
   - `master` of this repository strictly tracks `master` of `deploy-sourcegraph`, so there should be no merge conflicts.
   - If there are any merge conflicts in this step, you may `git checkout master && git rev-parse HEAD && git reset --hard upstream/master && git push -f origin master` which should always be 100% safe to do.
1. `git checkout release && git checkout -B merge_upstream` to create a branch where you will perform the merge.
1. `git merge upstream/master` to merge `deploy-sourcegraph@master` into `merge_upstream`
   - This will give you conflicts which you should address manually:
     - On docker image tags conflicts (`image:`), choose the `insiders` tag to allow renovate to deploy new builds.
     - On script conflicts (`create-new-cluster.sh`, `kubectl-apply-all.sh`, etc.), look for comments like `This is a custom script for dot-com` that indicate you should choose the current state over incoming changes.
   - If new services have been added (these generally show up as created files in `base/`), make sure that:
     - `namespace: prod` is applied to all new resource metadata.
   - Use `kubectl apply --dry-run --validate --recursive -f base/` to validate your work.
   - **Before you commit**, ensure the commit message indicates which files had conflicts for reviewers to look at.
     - Using the default merge commit message, you can copy or uncomment the lines following `Conflicts`.
1. Send a PR to this repository for merging `merge_upstream` into `release`.
1. Reviewers should review:
   - The conflicting files.
   - If there are any risks associated with merging that should be watched out for / addressed,
     such as [documented manual migrations](https://docs.sourcegraph.com/admin/updates/kubernetes)
     that will need to be performed as part of merging the PR.
1. If there are any manual migrations needed, coordinate with the distribution team and apply those first.
   - For example, new services that require elevated permissions might not be deployed by Buildkite - this must be done manually.
1. Once approved, **squash merge your PR so it can be easily reverted if needed**.
   - In general, it might be a good idea to avoid doing this at the end of a PDT workday - if something goes wrong, it is easier to get help if other people are around.
1. Watch CI, which will deploy the change automatically.
1. Check the deployment is healthy afterwards (`kubectl get pods` should show all healthy, searching should work).