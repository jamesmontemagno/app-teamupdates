import { useState } from 'react';
import { trace, context, metrics, getTracerProvider, logInfo, logWarn, logError } from '../telemetry';
import styles from './PageLayout.module.css';

/**
 * Debug page for testing OpenTelemetry integration
 * Provides manual controls to create spans and metrics
 */
export function TelemetryDebugPage() {
  const [output, setOutput] = useState<string[]>([]);

  const addLog = (message: string) => {
    setOutput(prev => [...prev, `${new Date().toISOString()}: ${message}`]);
    console.log('[TelemetryDebug]', message);
  };

  const createTestSpan = () => {
    try {
      const tracer = trace.getTracer('debug-page');
      const span = tracer.startSpan('test.manual.span');
      span.setAttribute('test.type', 'manual');
      span.setAttribute('test.timestamp', Date.now());
      addLog(`📝 Span created: ${span.spanContext().spanId}`);
      span.end();
      addLog('✅ Test span ended - waiting for export...');
      
      // Check if span was actually recorded
      setTimeout(() => {
        addLog('⏱️ 2 seconds elapsed - check console for export logs');
      }, 2000);
    } catch (error) {
      addLog(`❌ Error creating span: ${error}`);
    }
  };

  const createNestedSpans = () => {
    try {
      const tracer = trace.getTracer('debug-page');
      const parentSpan = tracer.startSpan('test.parent.span');
      addLog(`📝 Parent span created: ${parentSpan.spanContext().spanId}`);
      
      const childSpan = tracer.startSpan('test.child.span', {}, trace.setSpan(context.active(), parentSpan));
      childSpan.setAttribute('child.index', 1);
      addLog(`📝 Child span created: ${childSpan.spanContext().spanId}`);
      childSpan.end();
      
      parentSpan.end();
      addLog('✅ Nested spans ended - waiting for export...');
    } catch (error) {
      addLog(`❌ Error creating nested spans: ${error}`);
    }
  };

  const forceFlush = async () => {
    try {
      addLog('🔄 Forcing flush of all trace exporters...');
      const provider = getTracerProvider();
      if (provider) {
        await provider.forceFlush();
        addLog('✅ All trace exporters flushed - check console for export logs');
      } else {
        addLog('❌ Tracer provider not available');
      }
    } catch (error) {
      addLog(`❌ Error during force flush: ${error}`);
    }
  };

  const createTestMetric = () => {
    try {
      const meter = metrics.getMeter('debug-page');
      const counter = meter.createCounter('test.manual.counter', {
        description: 'Manual test counter',
      });
      counter.add(1, { 'test.type': 'manual' });
      addLog('✅ Test metric recorded');
    } catch (error) {
      addLog(`❌ Error creating metric: ${error}`);
    }
  };

  const testFetchInstrumentation = async () => {
    try {
      addLog('Sending test fetch request...');
      const response = await fetch('/api/teams');
      addLog(`✅ Fetch completed: ${response.status} (should create auto-instrumented span)`);
    } catch (error) {
      addLog(`❌ Fetch failed: ${error}`);
    }
  };

  const createTestLogs = () => {
    try {
      logInfo('Test info log from debug page', { 'test.type': 'manual', 'component': 'debug-page' });
      logWarn('Test warning log from debug page', { 'test.type': 'manual', 'component': 'debug-page' });
      logError('Test error log from debug page', new Error('Sample error'), { 'test.type': 'manual', 'component': 'debug-page' });
      addLog('✅ Test logs emitted (check Aspire dashboard structured logs)');
    } catch (error) {
      addLog(`❌ Error creating logs: ${error}`);
    }
  };

  const checkConfig = () => {
    const config = {
      VITE_ENABLE_TELEMETRY: import.meta.env.VITE_ENABLE_TELEMETRY,
      VITE_OTEL_EXPORTER_OTLP_ENDPOINT: import.meta.env.VITE_OTEL_EXPORTER_OTLP_ENDPOINT,
      VITE_OTEL_EXPORTER_OTLP_HEADERS: import.meta.env.VITE_OTEL_EXPORTER_OTLP_HEADERS ? '***SET***' : 'NOT SET',
      VITE_OTEL_RESOURCE_ATTRIBUTES: import.meta.env.VITE_OTEL_RESOURCE_ATTRIBUTES || 'NOT SET',
      VITE_OTEL_SERVICE_NAME: import.meta.env.VITE_OTEL_SERVICE_NAME,
      VITE_OTEL_TRACE_SAMPLE_RATE: import.meta.env.VITE_OTEL_TRACE_SAMPLE_RATE,
    };
    addLog('Current configuration:');
    Object.entries(config).forEach(([key, value]) => {
      addLog(`  ${key}: ${value}`);
    });
    addLog('');
    addLog('📊 Check browser console for detailed telemetry logs');
    addLog('🌐 Check Network tab, filter by "v1/traces" or "v1/metrics"');
    addLog('⏱️ Traces export every 500ms, metrics every 10s');
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageContent}>
        <h1>OpenTelemetry Debug Console</h1>
        
                <div>
          <h2>Test Controls</h2>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button onClick={checkConfig}>Check Config</button>
            <button onClick={createTestSpan}>Create Test Span</button>
            <button onClick={createNestedSpans}>Create Nested Spans</button>
            <button onClick={createTestMetric}>Create Test Metric</button>
            <button onClick={createTestLogs}>Create Test Logs</button>
            <button onClick={testFetchInstrumentation}>Test Fetch Instrumentation</button>
            <button onClick={forceFlush}>Force Flush Traces</button>
            <button onClick={() => setOutput([])}>Clear Output</button>
          </div>
        </div>

        <div>
          <h2>Output Log</h2>
          <div style={{
            backgroundColor: '#1e1e1e',
            color: '#d4d4d4',
            padding: '1rem',
            borderRadius: '4px',
            fontFamily: 'monospace',
            fontSize: '0.875rem',
            maxHeight: '400px',
            overflowY: 'auto',
          }}>
            {output.length === 0 ? (
              <div style={{ color: '#666' }}>No output yet. Click buttons above to test.</div>
            ) : (
              output.map((line, i) => <div key={i}>{line}</div>)
            )}
          </div>
        </div>

        <div style={{ marginTop: '2rem' }}>
          <h2>Instructions</h2>
          <ol>
            <li>Click "Check Config" to verify environment variables</li>
            <li>Open browser DevTools Console to see detailed logs</li>
            <li>Open Aspire Dashboard to see traces/metrics appear</li>
            <li>Click test buttons to manually create telemetry</li>
            <li>Check Network tab for POST requests to /v1/traces and /v1/metrics</li>
          </ol>
        </div>

        <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#f0f0f0', borderRadius: '4px' }}>
          <h3>Expected Behavior</h3>
          <ul>
            <li>✅ Config should show OTLP endpoint (from Aspire or .env)</li>
            <li>✅ Test spans/metrics should appear in Aspire Dashboard within 10 seconds</li>
            <li>✅ Fetch requests should create automatic spans</li>
            <li>❌ If you see CORS errors, check Aspire CORS configuration</li>
            <li>❌ If you see 401/403 errors, check OTLP headers (API key)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
