#!/usr/bin/env bash
# ==============================================================================
# NOQA Mobile CLI Automation & Environment Wrapper for Kindred (iOS/Android)
# ==============================================================================

set -e

COLOR_GREEN="\033[0;32m"
COLOR_CYAN="\033[0;36m"
COLOR_YELLOW="\033[1;33m"
COLOR_RED="\033[0;31m"
COLOR_RESET="\033[0m"

function log_info() {
    echo -e "${COLOR_CYAN}[NOQA INFO]${COLOR_RESET} $1"
}

function log_success() {
    echo -e "${COLOR_GREEN}[NOQA SUCCESS]${COLOR_RESET} $1"
}

function log_warn() {
    echo -e "${COLOR_YELLOW}[NOQA WARN]${COLOR_RESET} $1"
}

function log_error() {
    echo -e "${COLOR_RED}[NOQA ERROR]${COLOR_RESET} $1"
}

function check_env() {
    log_info "Checking mobile CLI dependencies..."
    
    if command -v node >/dev/null 2>&1; then
        log_success "Node.js $(node -v) detected"
    else
        log_error "Node.js is not installed!"
        exit 1
    fi

    if command -v xcodebuild >/dev/null 2>&1; then
        log_success "Xcode $(xcodebuild -version | head -n 1) detected"
    else
        log_warn "Xcode CLI tools not found (required for iOS builds)."
    fi

    if [ -n "$ANDROID_HOME" ]; then
        log_success "ANDROID_HOME detected at $ANDROID_HOME"
    else
        log_warn "ANDROID_HOME environment variable is not set."
    fi
}

function check_ts() {
    log_info "Running TypeScript type check..."
    npx tsc --noEmit
    log_success "TypeScript check passed with 0 errors!"
}

function run_ios() {
    check_env
    log_info "Launching iOS simulator..."
    npx react-native run-ios
}

function run_android() {
    check_env
    log_info "Launching Android emulator..."
    npx react-native run-android
}

function build_functions() {
    log_info "Compiling Firebase Cloud Functions..."
    cd functions && npx tsc && cd ..
    log_success "Firebase Cloud Functions compiled cleanly!"
}

function usage() {
    echo "Usage: ./scripts/noqa.sh [command]"
    echo ""
    echo "Commands:"
    echo "  env         Validate local iOS and Android CLI tools & environment"
    echo "  check       Run TypeScript verification and compile Cloud Functions"
    echo "  ios         Boot iOS simulator and start Kindred app"
    echo "  android     Boot Android emulator and start Kindred app"
    echo "  functions   Compile Firebase Cloud Functions"
    echo ""
}

case "$1" in
    env)
        check_env
        ;;
    check)
        check_ts
        build_functions
        ;;
    ios)
        run_ios
        ;;
    android)
        run_android
        ;;
    functions)
        build_functions
        ;;
    *)
        usage
        ;;
esac
