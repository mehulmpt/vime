<div
  on:mouseenter="{onSeeking}"
  on:mouseleave="{onSeeking}"
  on:mousemove={onSeeking}
  on:touchmove={() => { slider.focus(); }}
  on:touchend={() => { slider.blur(); }}
  on:mouseleave="{() => { slider.blur(); }}"
  bind:this={scrubber}
>
  <input
    type="range"
    role="slider"
    step="0.01"
    min="0"
    max={ariaDuration}
    autocomplete="off"
    aria-label={$i18n.scrubber}
    aria-valuemin="0"
    aria-valuemax={ariaDuration}
    aria-valuenow={$currentTime}
    aria-valuetext={scrubberLabel}
    aria-orientation="horizontal"
    use:vInputTouch
    on:input={onSeek}
    bind:this={slider}
  />
  <progress
    role="progressbar"
    class:loading={$buffering}
    class:audio={!$isVideoView}
    class:video={$isVideoView}
    min="0"
    max={ariaDuration}
    value={$buffered}
    aria-label={$i18n.buffered}
    aria-valuemin="0"
    aria-valuemax={ariaDuration}
    aria-valuenow={$buffered}
    aria-valuetext={`${($buffered / ariaDuration).toFixed(0)}%`}
    aria-orientation="horizontal"
    bind:this={progressBar}
  >
    % buffered
  </progress>
  <svelte:component 
    {player}
    noBounding
    title={tooltipTitle}
    isActive={tooltipActive}
    this={Tooltip}
    bind:this={tooltip}
  />
</div>

<script context="module">
  export const ID = 'vScrubberControl';
  export const LABEL = 'seek';
</script>

<script>
  import { set_style_raf, format_time, vInputTouch } from '@vime-js/utils';
  import { ID as TooltipsID } from '../../tooltips/Tooltips.svelte';

  // --------------------------------------------------------------
  // Setup
  // --------------------------------------------------------------

  export let player;

  const plugins = player.getPluginsRegistry();

  const {
    i18n, isVideoView, currentTime,
    duration, buffered, buffering,
  } = player.getStore();
  
  // --------------------------------------------------------------
  // Props
  // --------------------------------------------------------------

  let slider;
  let scrubber;
  let progressBar;
  
  let tooltip;
  let tooltipTitle;
  let tooltipActive;

  export const getEl = () => scrubber;
  export const getSlider = () => slider;
  export const getTooltip = () => tooltip;
  export const getProgressBar = () => progressBar;

  $: if (slider) slider.value = $currentTime;
  $: if (slider) slider.style.setProperty('--value', `${($currentTime / $duration) * 100}%`);
  
  $: ariaDuration = Math.max(0, $duration);
  
  $: scrubberLabel = $i18n.scrubberLabel
    .replace('{currentTime}', format_time($currentTime))
    .replace('{duration}', format_time(ariaDuration));

  // --------------------------------------------------------------
  // Tooltips Plugin
  // --------------------------------------------------------------

  const setTooltipXPos = (percent, value) => {
    if (!tooltip.getEl()) return;
    const rect = tooltip.getEl().getBoundingClientRect();
    const bounds = scrubber.parentNode.getBoundingClientRect();
    const scrubberRect = scrubber.getBoundingClientRect();
    const leftOffset = scrubberRect.left - bounds.left;
    const rightOffset = bounds.right - scrubberRect.right;
    const leftLimit = bounds.left + leftOffset;
    const rightLimit = bounds.right - rightOffset;
    if ((rect.left + percent > leftLimit) && (rect.right - (100 - percent) < rightLimit)) {
      set_style_raf(tooltip.getEl(), 'left', `${value}px`);
    }
  };

  $: tooltips = $plugins[TooltipsID];
  $: Tooltip = tooltips && tooltips.getTooltipComponent();
  $: tooltipsRegistry = tooltips && tooltips.getRegistry();
  
  $: if (tooltipsRegistry && tooltip && !tooltipsRegistry.has(LABEL)) {
    tooltipsRegistry.register(LABEL, tooltip);
  }

  // --------------------------------------------------------------
  // Events
  // --------------------------------------------------------------

  const onSeek = (e) => { $currentTime = window.parseFloat(e.target.value); };
  
  const onSeeking = (e) => {
    if ($duration <= 0 || !tooltip) return;
    const rect = scrubber.getBoundingClientRect();
    const percent = Math.max(0, Math.min(100, (100 / rect.width) * (e.pageX - rect.left)));
    tooltipActive = e.type !== 'mouseleave';
    tooltipTitle = format_time(($duration / 100) * percent);
    setTooltipXPos(percent, (percent / 100) * rect.width);
  };
</script>

<style type="text/scss">
  @import '../../../style/common';

  $scrubber-loading-size: 25px;
  $scrubber-loading-color: $color-gray-300;
  $scrubber-loading-bg: $color-gray-600;

  $video-scrubber-buffered-bg: $color-white-200;
  $audio-scrubber-buffered-bg: $color-gray-100;

  // Offset the range thumb in order to be able to calculate the relative progress
  $scrubber-offset: $range-thumb-height;

  @keyframes progress {
    to {
      background-position: $scrubber-loading-size 0;
    }
  }

  div {
    flex: 1;
    left: $scrubber-offset / 2;
    margin-right: $scrubber-offset;
    position: relative;
    pointer-events: auto;
    margin-bottom: 3px;

    :global([role='tooltip']) {
      margin-bottom: 6px;
    }
  }

  input[type='range'],
  progress {
    height: 12px;
    margin-left: -($scrubber-offset / 2);
    margin-right: -($scrubber-offset / 2);
    width: calc(100% + #{$scrubber-offset});

    &:hover {
      cursor: pointer;
    }
  }

  input[type='range'] {
    position: relative;
    z-index: 3;
  }

  progress {
    -webkit-appearance: none;
    background: transparent;
    border: 0;
    border-radius: 100px;
    height: $range-track-height;
    left: 0;
    margin-top: -($range-track-height / 2);
    padding: 0;
    position: absolute;
    top: 50%;

    &::-webkit-progress-bar {
      background: transparent;
    }

    &::-webkit-progress-value {
      background: currentColor;
      border-radius: 100px;
      min-width: $range-track-height;
      transition: width 0.2s ease;
    }

    &::-moz-progress-bar {
      background: currentColor;
      border-radius: 100px;
      min-width: $range-track-height;
      transition: width 0.2s ease;
    }

    &::-ms-fill {
      border-radius: 100px;
      transition: width 0.2s ease;
    }

    &.video {
      box-shadow: 0 1px 1px $color-gray-100;
      color: $video-scrubber-buffered-bg;
    }

    &.audio {
      color: $audio-scrubber-buffered-bg;
    }

    &.loading {
      animation: progress 1s linear infinite;
      background-image: linear-gradient(-45deg,
      $scrubber-loading-bg 25%,
      $scrubber-loading-color 25%,
      $scrubber-loading-color 50%,
      $scrubber-loading-bg 50%,
      $scrubber-loading-bg 75%,
      $scrubber-loading-color 75%,
      $scrubber-loading-color);
      background-repeat: repeat-x;
      background-size: $scrubber-loading-size $scrubber-loading-size;
      color: $scrubber-loading-color;

      &.video {
        background-color: $video-scrubber-buffered-bg;
      }

      &.audio {
        background-color: $audio-scrubber-buffered-bg;
      }
    }
  }
</style>