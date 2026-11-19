// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
#define _GNU_SOURCE
#include <arpa/inet.h>
#include <dlfcn.h>
#include <errno.h>
#include <stdio.h>
#include <stdlib.h>
#include <sys/socket.h>

static unsigned short target_port;
static const char *bound_path;

__attribute__((constructor)) static void configure(void) {
  const char *value = getenv("AGENT_LYNX_SIMULATOR_PORT");
  if (value) {
    char *end;
    long port = strtol(value, &end, 10);
    if (end != value && !*end && port > 0 && port <= 65535)
      target_port = (unsigned short)port;
  }
  bound_path = getenv("AGENT_LYNX_SIMULATOR_BOUND");
}

#ifdef __APPLE__
static int simulator_bind(int fd, const struct sockaddr *address, socklen_t length) {
  // dyld leaves references from the interposing library pointing at the original.
  int (*original)(int, const struct sockaddr *, socklen_t) = bind;
#else
int bind(int fd, const struct sockaddr *address, socklen_t length) {
  int (*original)(int, const struct sockaddr *, socklen_t) = dlsym(RTLD_NEXT, "bind");
  if (!original) {
    errno = ENOSYS;
    return -1;
  }
#endif
  if (target_port && address && length >= sizeof(struct sockaddr_in) && address->sa_family == AF_INET) {
    const struct sockaddr_in *ipv4 = (const struct sockaddr_in *)address;
    unsigned short port = ntohs(ipv4->sin_port);
    int type;
    socklen_t size = sizeof(type);
    // DebugRouter probes this range; leave UDP and unrelated listeners alone.
    if (port >= 8901 && port <= 8920 && !getsockopt(fd, SOL_SOCKET, SO_TYPE, &type, &size) && type == SOCK_STREAM) {
      struct sockaddr_in redirected = *ipv4;
      redirected.sin_port = htons(target_port);
      redirected.sin_addr.s_addr = htonl(INADDR_LOOPBACK);
      int result = original(fd, (const struct sockaddr *)&redirected, sizeof(redirected));
      if (!result && bound_path) {
        int saved_errno = errno;
        FILE *marker = fopen(bound_path, "w");
        if (marker) fclose(marker);
        errno = saved_errno;
      }
      return result;
    }
  }
  return original(fd, address, length);
}

#ifdef __APPLE__
__attribute__((used, section("__DATA,__interpose")))
static const struct { const void *replacement; const void *original; } interpose = {
  (const void *)simulator_bind, (const void *)bind
};
#endif
