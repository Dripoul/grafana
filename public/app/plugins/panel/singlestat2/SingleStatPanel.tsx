// Libraries
import React, { PureComponent } from 'react';

// Types
import { SingleStatOptions, SingleStatBaseOptions } from './types';

import { Sparkline } from '@grafana/ui/src/components/BigValue/BigValue';
import { DisplayValue, PanelProps, processTimeSeries, NullValueMode } from '@grafana/ui';
import { config } from 'app/core/config';
import { getDisplayProcessor, BigValue } from '@grafana/ui';
import { ProcessedValuesRepeater } from './ProcessedValuesRepeater';

export const getSingleStatValues = (props: PanelProps<SingleStatBaseOptions>): DisplayValue[] => {
  const { data, replaceVariables, options } = props;
  const { valueOptions, valueMappings } = options;
  const { unit, decimals, stat } = valueOptions;

  const processor = getDisplayProcessor({
    unit,
    decimals,
    mappings: valueMappings,
    thresholds: options.thresholds,
    prefix: replaceVariables(valueOptions.prefix),
    suffix: replaceVariables(valueOptions.suffix),
    theme: config.theme,
  });

  return processTimeSeries({
    data,
    nullValueMode: NullValueMode.Null,
  }).map((series, index) => {
    const value = stat !== 'name' ? series.stats[stat] : series.label;
    return processor(value);
  });
};

interface SingleStatDisplay {
  value: DisplayValue;
  prefix?: DisplayValue;
  suffix?: DisplayValue;
  sparkline?: Sparkline;
  backgroundColor?: string;
}

export class SingleStatPanel extends PureComponent<PanelProps<SingleStatOptions>> {
  renderValue = (value: SingleStatDisplay, width: number, height: number): JSX.Element => {
    return <BigValue {...value} width={width} height={height} theme={config.theme} />;
  };

  getProcessedValues = (): SingleStatDisplay[] => {
    const { data, replaceVariables, options } = this.props;
    const { valueOptions, valueMappings } = options;
    const processor = getDisplayProcessor({
      unit: valueOptions.unit,
      decimals: valueOptions.decimals,
      mappings: valueMappings,
      thresholds: options.thresholds,
      theme: config.theme,
    });

    const { colorBackground, colorValue, colorPrefix, colorPostfix, sparkline } = options;

    return processTimeSeries({
      data,
      nullValueMode: NullValueMode.Null,
    }).map(tsvm => {
      const v: SingleStatDisplay = {
        value: processor(tsvm.stats[valueOptions.stat]),
      };
      const color = v.value.color;
      if (!colorValue) {
        delete v.value.color;
      }
      if (colorBackground) {
        v.backgroundColor = color;
      }
      if (options.valueFontSize) {
        v.value.fontSize = options.valueFontSize;
      }

      if (valueOptions.prefix) {
        v.prefix = {
          text: replaceVariables(valueOptions.prefix),
          numeric: NaN,
          color: colorPrefix ? color : null,
          fontSize: options.prefixFontSize,
        };
      }
      if (valueOptions.suffix) {
        v.suffix = {
          text: replaceVariables(valueOptions.suffix),
          numeric: NaN,
          color: colorPostfix ? color : null,
          fontSize: options.postfixFontSize,
        };
      }

      if (sparkline.show && tsvm.data.length > 1) {
        v.sparkline = {
          ...sparkline,
          data: tsvm.data,
          minX: tsvm.data[0][0], // TODO, get the time somehow
          maxX: tsvm.data[tsvm.data.length - 1][0],
        };
      }
      return v;
    });
  };

  render() {
    const { height, width, options, data, renderCounter } = this.props;
    return (
      <ProcessedValuesRepeater
        getProcessedValues={this.getProcessedValues}
        renderValue={this.renderValue}
        width={width}
        height={height}
        source={data}
        renderCounter={renderCounter}
        orientation={options.orientation}
      />
    );
  }
}
