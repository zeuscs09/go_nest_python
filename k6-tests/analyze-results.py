#!/usr/bin/env python3
"""
API Performance Analyzer & Comparison Tool
วิเคราะห์และเปรียบเทียบผลการทดสอบ k6 ระหว่างภาษาต่าง ๆ
"""

import json
import glob
import os
import sys
from datetime import datetime
import statistics
from pathlib import Path

# Try to import optional dependencies
try:
    import matplotlib.pyplot as plt
    import pandas as pd
    PLOTTING_AVAILABLE = True
except ImportError:
    PLOTTING_AVAILABLE = False
    print("📊 Note: matplotlib and pandas not installed. Charts will not be generated.")
    print("💡 Install with: pip install matplotlib pandas")

class APIPerformanceAnalyzer:
    def __init__(self, results_dir="stress-test-results"):
        self.results_dir = Path(results_dir)
        self.apis = ['golang', 'nestjs', 'python', 'dotnet']
        self.api_colors = {
            'golang': '#00ADD8',
            'nestjs': '#E0234E', 
            'python': '#3776AB',
            'dotnet': '#512BD4'
        }
        self.api_emojis = {
            'golang': '🟢',
            'nestjs': '🔴',
            'python': '🟡',
            'dotnet': '🔵'
        }
        
    def find_result_files(self):
        """หาไฟล์ผลการทดสอบทั้งหมด"""
        patterns = [
            "benchmark-comparison-results-*.json",
            "quick-stress-*.json",
            "full-stress-*.json",
            "spike-test-*.json"
        ]
        
        files = []
        for pattern in patterns:
            files.extend(glob.glob(str(self.results_dir / pattern)))
        
        return sorted(files, key=os.path.getmtime, reverse=True)
    
    def parse_benchmark_results(self, file_path):
        """วิเคราะห์ไฟล์ผลการทดสอบ"""
        try:
            # Try to load as single JSON first
            with open(file_path, 'r') as f:
                data = json.load(f)
            
            # ถ้าเป็น benchmark comparison results
            if 'apiComparison' in data:
                return data['apiComparison']
                
        except json.JSONDecodeError:
            # If single JSON fails, try k6 NDJSON format
            data = self.parse_k6_ndjson(file_path)
        
        # ดึงข้อมูลจาก metrics
        results = {}
        
        # ถ้าเป็น regular k6 results
        for api in self.apis:
            results[api] = {
                'requests': 0,
                'avgResponseTime': 0,
                'p95ResponseTime': 0,
                'errorRate': 0
            }
            
            # ดึงข้อมูลจาก metrics
            if f'{api}_requests' in data.get('metrics', {}):
                results[api]['requests'] = data['metrics'][f'{api}_requests']['values']['count']
                
            if f'{api}_response_time' in data.get('metrics', {}):
                rt_data = data['metrics'][f'{api}_response_time']['values']
                results[api]['avgResponseTime'] = rt_data.get('avg', 0)
                results[api]['p95ResponseTime'] = rt_data.get('p(95)', 0)
                
            if f'{api}_errors' in data.get('metrics', {}):
                results[api]['errorRate'] = data['metrics'][f'{api}_errors']['values']['rate'] * 100
        
        return results
    
    def parse_k6_ndjson(self, file_path):
        """วิเคราะห์ไฟล์ NDJSON จาก k6"""
        print(f"📊 Parsing k6 NDJSON format: {os.path.basename(file_path)}")
        
        # Collect metrics from k6 NDJSON
        metrics = {}
        api_stats = {}
        
        # Initialize API stats
        for api in self.apis:
            api_stats[api] = {
                'requests': 0,
                'total_duration': 0,
                'durations': [],
                'errors': 0
            }
        
        line_count = 0
        with open(file_path, 'r') as f:
            for line in f:
                line_count += 1
                if line_count % 10000 == 0:
                    print(f"  Processing line {line_count}...")
                
                try:
                    record = json.loads(line.strip())
                    
                    # Skip non-point records
                    if record.get('type') != 'Point':
                        continue
                    
                    # Extract API name from tags
                    tags = record.get('data', {}).get('tags', {})
                    api_name = tags.get('api')
                    
                    if not api_name or api_name not in self.apis:
                        continue
                    
                    metric_name = record.get('metric')
                    value = record.get('data', {}).get('value', 0)
                    
                    # Count requests
                    if metric_name == 'http_reqs':
                        api_stats[api_name]['requests'] += 1
                    
                    # Collect response times
                    elif metric_name == 'http_req_duration':
                        api_stats[api_name]['durations'].append(value)
                        api_stats[api_name]['total_duration'] += value
                    
                    # Count errors (non-2xx responses)
                    elif metric_name == 'http_reqs':
                        status = tags.get('status', '200')
                        if not status.startswith('2'):
                            api_stats[api_name]['errors'] += 1
                
                except (json.JSONDecodeError, KeyError) as e:
                    # Skip malformed lines
                    continue
        
        print(f"  Processed {line_count} lines")
        
        # Calculate metrics for each API
        results = {}
        for api in self.apis:
            stats = api_stats[api]
            requests = stats['requests']
            durations = stats['durations']
            errors = stats['errors']
            
            if requests > 0 and durations:
                avg_response_time = sum(durations) / len(durations)
                sorted_durations = sorted(durations)
                p95_index = max(0, int(len(sorted_durations) * 0.95) - 1)
                p95_response_time = sorted_durations[p95_index] if sorted_durations else 0
                error_rate = (errors / requests) * 100
            else:
                avg_response_time = 0
                p95_response_time = 0
                error_rate = 0
            
            results[api] = {
                'requests': requests,
                'avgResponseTime': avg_response_time,
                'p95ResponseTime': p95_response_time,
                'errorRate': error_rate
            }
            
            print(f"  {self.api_emojis[api]} {api}: {requests} requests, {avg_response_time:.2f}ms avg, {error_rate:.1f}% errors")
        
        return {'apiComparison': results}
    
    def generate_comparison_report(self, results_data, output_file=None):
        """สร้างรายงานเปรียบเทียบ"""
        if not results_data:
            return "❌ No data available for comparison"
        
        # เรียงลำดับตาม avgResponseTime
        sorted_apis = sorted(results_data.items(), key=lambda x: x[1]['avgResponseTime'])
        
        report = f"""
🏆 API PERFORMANCE COMPARISON ANALYSIS
=====================================
📅 Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

📊 PERFORMANCE RANKING:
"""
        
        for i, (api, data) in enumerate(sorted_apis):
            rank = i + 1
            medal = ['🥇', '🥈', '🥉', '🏅'][min(i, 3)]
            emoji = self.api_emojis.get(api, '⚪')
            
            report += f"""
{medal} #{rank} {emoji} {api.upper()}
   • Requests: {data['requests']:,}
   • Avg Response: {data['avgResponseTime']:.2f}ms
   • P95 Response: {data['p95ResponseTime']:.2f}ms
   • Error Rate: {data['errorRate']:.2f}%
"""
        
        # Performance Analysis
        fastest = sorted_apis[0]
        slowest = sorted_apis[-1]
        
        report += f"""
📈 PERFORMANCE ANALYSIS:

• 🚀 FASTEST: {self.api_emojis[fastest[0]]} {fastest[0].upper()} 
  └── {fastest[1]['avgResponseTime']:.2f}ms average response time
  
• 🐌 SLOWEST: {self.api_emojis[slowest[0]]} {slowest[0].upper()}
  └── {slowest[1]['avgResponseTime']:.2f}ms average response time
  
• 📊 SPEED DIFFERENCE: {((slowest[1]['avgResponseTime'] - fastest[1]['avgResponseTime']) / fastest[1]['avgResponseTime'] * 100):.1f}%
"""
                
        # Statistics
        avg_times = [data['avgResponseTime'] for _, data in sorted_apis if data['avgResponseTime'] > 0]
        if avg_times and len(avg_times) > 1:
            report += f"""
📊 RESPONSE TIME STATISTICS:
• Mean: {statistics.mean(avg_times):.2f}ms
• Median: {statistics.median(avg_times):.2f}ms
• Std Dev: {statistics.stdev(avg_times):.2f}ms
"""
        elif avg_times:
            report += f"""
📊 RESPONSE TIME STATISTICS:
• Mean: {statistics.mean(avg_times):.2f}ms
• Median: {statistics.median(avg_times):.2f}ms
• Std Dev: N/A (single value)
"""
        
        # Recommendations
        report += f"""
🔍 RECOMMENDATIONS:
"""
        
        for api, data in sorted_apis:
            emoji = self.api_emojis[api]
            if data['avgResponseTime'] < 10:
                report += f"• ✅ {emoji} {api.upper()}: Excellent performance - ready for production\n"
            elif data['avgResponseTime'] < 50:
                report += f"• ✅ {emoji} {api.upper()}: Good performance - suitable for most use cases\n"
            elif data['avgResponseTime'] < 100:
                report += f"• ⚠️ {emoji} {api.upper()}: Moderate performance - monitor under load\n"
            else:
                report += f"• 🔧 {emoji} {api.upper()}: Needs optimization - investigate bottlenecks\n"
                
            if data['errorRate'] > 1:
                report += f"• 🚨 {emoji} {api.upper()}: High error rate ({data['errorRate']:.2f}%) - needs investigation\n"
        
        if output_file:
            with open(output_file, 'w') as f:
                f.write(report)
            print(f"📄 Report saved to: {output_file}")
        
        return report
    
    def create_performance_charts(self, results_data, output_dir=None):
        """สร้างกราฟเปรียบเทียบ"""
        if not PLOTTING_AVAILABLE:
            print("📊 Charts not available - matplotlib/pandas not installed")
            return
        
        if not results_data:
            print("❌ No data available for charts")
            return
        
        output_dir = output_dir or self.results_dir
        
        # Prepare data
        apis = list(results_data.keys())
        avg_times = [results_data[api]['avgResponseTime'] for api in apis]
        p95_times = [results_data[api]['p95ResponseTime'] for api in apis]
        error_rates = [results_data[api]['errorRate'] for api in apis]
        colors = [self.api_colors.get(api, '#333333') for api in apis]
        
        # Create figure with subplots
        fig, ((ax1, ax2), (ax3, ax4)) = plt.subplots(2, 2, figsize=(15, 12))
        fig.suptitle('🏆 API Performance Comparison', fontsize=16, fontweight='bold')
        
        # 1. Average Response Time
        bars1 = ax1.bar(apis, avg_times, color=colors, alpha=0.7)
        ax1.set_title('📊 Average Response Time')
        ax1.set_ylabel('Response Time (ms)')
        ax1.set_xlabel('API')
        for i, bar in enumerate(bars1):
            height = bar.get_height()
            ax1.text(bar.get_x() + bar.get_width()/2., height,
                    f'{height:.1f}ms', ha='center', va='bottom')
        
        # 2. P95 Response Time
        bars2 = ax2.bar(apis, p95_times, color=colors, alpha=0.7)
        ax2.set_title('📈 P95 Response Time')
        ax2.set_ylabel('Response Time (ms)')
        ax2.set_xlabel('API')
        for i, bar in enumerate(bars2):
            height = bar.get_height()
            ax2.text(bar.get_x() + bar.get_width()/2., height,
                    f'{height:.1f}ms', ha='center', va='bottom')
        
        # 3. Error Rate
        bars3 = ax3.bar(apis, error_rates, color=colors, alpha=0.7)
        ax3.set_title('❌ Error Rate')
        ax3.set_ylabel('Error Rate (%)')
        ax3.set_xlabel('API')
        for i, bar in enumerate(bars3):
            height = bar.get_height()
            ax3.text(bar.get_x() + bar.get_width()/2., height,
                    f'{height:.2f}%', ha='center', va='bottom')
        
        # 4. Performance Comparison (Radar-like)
        requests = [results_data[api]['requests'] for api in apis]
        normalized_requests = [r/max(requests)*100 if max(requests) > 0 else 0 for r in requests]
        
        ax4.scatter(avg_times, normalized_requests, 
                   s=[100 + (1000 * (1 - er/100)) for er in error_rates],
                   c=colors, alpha=0.7)
        ax4.set_xlabel('Average Response Time (ms)')
        ax4.set_ylabel('Normalized Requests (%)')
        ax4.set_title('🎯 Performance vs Load (size = reliability)')
        
        for i, api in enumerate(apis):
            ax4.annotate(api, (avg_times[i], normalized_requests[i]),
                        xytext=(5, 5), textcoords='offset points')
        
        plt.tight_layout()
        
        # Save chart
        chart_file = output_dir / f'performance-comparison-{datetime.now().strftime("%Y%m%d-%H%M%S")}.png'
        plt.savefig(chart_file, dpi=300, bbox_inches='tight')
        print(f"📊 Chart saved to: {chart_file}")
        
        # Show if interactive
        if sys.stdout.isatty():
            plt.show()
    
    def run_analysis(self, latest_only=True):
        """รันการวิเคราะห์"""
        print("🔍 Analyzing API Performance Results...")
        
        files = self.find_result_files()
        if not files:
            print("❌ No result files found in", self.results_dir)
            return
        
        if latest_only:
            files = files[:1]
        
        for file_path in files:
            print(f"\n📄 Analyzing: {os.path.basename(file_path)}")
            
            try:
                results = self.parse_benchmark_results(file_path)
                
                if not any(results.values()):
                    print("⚠️ No performance data found in this file")
                    continue
                
                # Generate report
                report = self.generate_comparison_report(results)
                print(report)
                
                # Save report
                report_file = self.results_dir / f"analysis-{datetime.now().strftime('%Y%m%d-%H%M%S')}.txt"
                with open(report_file, 'w') as f:
                    f.write(report)
                
                # Generate charts
                self.create_performance_charts(results)
                
            except Exception as e:
                print(f"❌ Error analyzing {file_path}: {e}")

def main():
    """Main function"""
    analyzer = APIPerformanceAnalyzer()
    
    if len(sys.argv) > 1:
        if sys.argv[1] == '--all':
            analyzer.run_analysis(latest_only=False)
        elif sys.argv[1] == '--help':
            print("""
🔍 API Performance Analyzer

Usage:
  python analyze-results.py           # Analyze latest results
  python analyze-results.py --all     # Analyze all results
  python analyze-results.py --help    # Show this help

Features:
• 📊 Performance comparison between APIs
• 📈 Response time analysis
• 🎯 Error rate monitoring
• 📄 Detailed reports
• 📊 Visual charts (if matplotlib available)
""")
            return
    else:
        analyzer.run_analysis()

if __name__ == "__main__":
    main() 