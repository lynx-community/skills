import { useMemo, useState } from '@lynx-js/react';
import {
  Button,
  DialogBackdrop,
  DialogContent,
  DialogRoot,
  DialogView,
  PopoverAnchor,
  PopoverArrow,
  PopoverContent,
  PopoverPositioner,
  PopoverRoot,
  PopoverTrigger,
  Radio,
  RadioGroupRoot,
  RadioIndicator,
  ScrollView,
  Switch,
  SwitchThumb,
} from '@lynx-js/lynx-ui';

const STEP_OPTIONS = [1, 2, 5] as const;

export default function Main() {
  const [count, setCount] = useState(0);
  const [step, setStep] = useState<(typeof STEP_OPTIONS)[number]>(1);
  const [goalEnabled, setGoalEnabled] = useState(true);
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  const goal = 10;
  const progress = useMemo(() => {
    if (!goalEnabled) {
      return 0;
    }

    return Math.min(count / goal, 1);
  }, [count, goalEnabled]);

  const statusText = useMemo(() => {
    if (!goalEnabled) {
      return 'Goal tracking is turned off.';
    }

    if (count >= goal) {
      return 'You reached the sample goal.';
    }

    return `${goal - count} more taps to reach ${goal}.`;
  }, [count, goalEnabled]);

  const progressWidth = `${Math.max(progress * 100, 8)}%`;

  return (
    // ScrollView is a good default for screen-level examples because it keeps
    // the composition close to the official Lynx UI screen recipe structure.
    <ScrollView>
      <view className="min-h-screen bg-paper px-16 py-20">
        <view className="rounded-16 border border-line bg-paper-elevated px-16 py-16">
          <view className="flex-row items-center justify-between">
            <view>
              <text className="text-24 font-bold text-content">Counter app</text>
              <text className="mt-4 text-14 text-content-muted">
                A one-file Lynx UI example that composes several primitives.
              </text>
            </view>

            {/* Popover keeps the official trigger/anchor/positioner/content stack
                so future edits preserve Lynx UI layering instead of replacing it. */}
            <PopoverRoot show={helpOpen} onShowChange={setHelpOpen}>
              <PopoverTrigger>
                <Button onClick={() => setHelpOpen(value => !value)}>
                  {({ active }) => (
                    <view
                      className={`rounded-full border border-line px-12 py-8 ${active ? 'ui-active bg-paper' : 'bg-paper-elevated'}`}
                    >
                      <text className="text-12 text-content">Help</text>
                    </view>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverAnchor>
                <PopoverPositioner>
                  <PopoverContent>
                    <view className="max-w-220 rounded-12 border border-line bg-paper px-12 py-12">
                      <text className="text-14 font-medium text-content">Reference notes</text>
                      <text className="mt-6 text-12 text-content-muted">
                        Use Button for actions, RadioGroup for step selection, Switch for optional goal state, and Dialog for confirm flows.
                      </text>
                    </view>
                    <PopoverArrow />
                  </PopoverContent>
                </PopoverPositioner>
              </PopoverAnchor>
            </PopoverRoot>
          </view>

          <view className="mt-20 items-center rounded-16 bg-paper px-16 py-24">
            <text className="text-14 text-content-muted">Current count</text>
            <text className="mt-8 text-40 font-bold text-content">{count}</text>
            <text className="mt-8 text-14 text-content-muted">{statusText}</text>
          </view>

          <view className="mt-16 rounded-16 border border-line bg-paper px-12 py-12">
            <view className="flex-row items-center justify-between">
              <text className="text-14 font-medium text-content">Goal progress</text>
              <text className="text-12 text-content-muted">
                {goalEnabled ? `${Math.min(count, goal)} / ${goal}` : 'Disabled'}
              </text>
            </view>
            <view className="mt-10 h-8 overflow-hidden rounded-full bg-paper-elevated">
              <view
                className="h-full rounded-full bg-primary"
                style={{ width: progressWidth }}
              />
            </view>
          </view>

          <view className="mt-16 rounded-16 border border-line bg-paper px-12 py-12">
            <view className="flex-row items-center justify-between">
              <view>
                <text className="text-14 font-medium text-content">Enable goal</text>
                <text className="mt-4 text-12 text-content-muted">
                  Switch is the official Lynx UI primitive for boolean state.
                </text>
              </view>

              {/* Keep Switch and SwitchThumb together to match the documented
                  composition shape for the toggle primitive. */}
              <Switch checked={goalEnabled} onChange={setGoalEnabled}>
                <SwitchThumb />
              </Switch>
            </view>
          </view>

          <view className="mt-16 rounded-16 border border-line bg-paper px-12 py-12">
            <text className="text-14 font-medium text-content">Step size</text>
            <text className="mt-4 text-12 text-content-muted">
              RadioGroup is useful when exactly one option should be active.
            </text>

            {/* Keep RadioGroupRoot with Radio and RadioIndicator so the example
                stays aligned with the official subcomponent structure. */}
            <RadioGroupRoot
              className="mt-12 flex-row gap-10"
              value={String(step)}
              onValueChange={value => setStep(Number(value) as (typeof STEP_OPTIONS)[number])}
            >
              {STEP_OPTIONS.map(option => (
                <Radio key={option} value={String(option)}>
                  {({ checked }) => (
                    <view
                      className={`flex-row items-center rounded-full border px-12 py-8 ${checked ? 'border-primary bg-paper-elevated' : 'border-line bg-paper'}`}
                    >
                      <RadioIndicator />
                      <text className="ml-8 text-12 text-content">Step {option}</text>
                    </view>
                  )}
                </Radio>
              ))}
            </RadioGroupRoot>
          </view>

          <view className="mt-16 gap-12">
            {/* Button uses a render prop so stateful styling can stay inside the
                official primitive instead of custom press-state wiring. */}
            <Button onClick={() => setCount(value => value + step)}>
              {({ active }) => (
                <view
                  className={`items-center rounded-16 px-16 py-14 ${active ? 'ui-active bg-primary' : 'bg-primary'}`}
                >
                  <text className="text-16 font-medium text-white">Increment by {step}</text>
                </view>
              )}
            </Button>

            <view className="flex-row gap-12">
              <view className="flex-1">
                <Button onClick={() => setCount(value => value - step)}>
                  {({ active }) => (
                    <view
                      className={`items-center rounded-16 border border-line px-16 py-14 ${active ? 'ui-active bg-paper-elevated' : 'bg-paper'}`}
                    >
                      <text className="text-14 text-content">Decrement</text>
                    </view>
                  )}
                </Button>
              </view>

              <view className="flex-1">
                <Button onClick={() => setConfirmResetOpen(true)}>
                  {({ active }) => (
                    <view
                      className={`items-center rounded-16 border border-line px-16 py-14 ${active ? 'ui-active bg-paper-elevated' : 'bg-paper'}`}
                    >
                      <text className="text-14 text-content">Reset</text>
                    </view>
                  )}
                </Button>
              </view>
            </view>
          </view>
        </view>
      </view>

      {/* Dialog keeps the official Root/View/Backdrop/Content layering for a
          simple confirm flow that future agents can copy into other screens. */}
      <DialogRoot show={confirmResetOpen} onShowChange={setConfirmResetOpen}>
        <DialogView>
          <DialogBackdrop clickToClose />
          <DialogContent>
            <view className="mx-20 rounded-16 border border-line bg-paper px-16 py-16">
              <text className="text-18 font-semibold text-content">Reset counter?</text>
              <text className="mt-8 text-14 text-content-muted">
                This clears the current count and keeps the rest of the demo state intact.
              </text>

              <view className="mt-16 flex-row gap-12">
                <view className="flex-1">
                  <Button onClick={() => setConfirmResetOpen(false)}>
                    {({ active }) => (
                      <view
                        className={`items-center rounded-12 border border-line px-12 py-12 ${active ? 'ui-active bg-paper-elevated' : 'bg-paper'}`}
                      >
                        <text className="text-14 text-content">Cancel</text>
                      </view>
                    )}
                  </Button>
                </view>

                <view className="flex-1">
                  <Button
                    onClick={() => {
                      setCount(0);
                      setConfirmResetOpen(false);
                    }}
                  >
                    {({ active }) => (
                      <view
                        className={`items-center rounded-12 px-12 py-12 ${active ? 'ui-active bg-primary' : 'bg-primary'}`}
                      >
                        <text className="text-14 font-medium text-white">Confirm</text>
                      </view>
                    )}
                  </Button>
                </view>
              </view>
            </view>
          </DialogContent>
        </DialogView>
      </DialogRoot>
    </ScrollView>
  );
}
