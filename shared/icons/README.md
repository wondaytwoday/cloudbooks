# 공식 아키텍처 아이콘 넣는 곳

이 폴더에 각 사가 배포하는 아키텍처 아이콘 SVG를 넣고 `manifest.json`에 등록하면, 도면이 자체 아이콘 대신 그 파일을 씁니다.

```
shared/icons/
  manifest.json
  aws/     ← AWS 아키텍처 아이콘
  gcp/     ← Google Cloud 아이콘
  azure/   ← Azure 아키텍처 아이콘
```

1. 각 사의 아키텍처 아이콘 공식 배포 페이지에서 SVG 세트를 내려받습니다. draw.io에 들어 있는 것과 같은 세트입니다.
2. 사용 조건(도면에 쓰는 것은 허용, 아이콘 자체를 수정하거나 상표처럼 쓰는 것은 제한 등)을 읽고, 꼭 필요한 파일만 복사합니다.
3. `manifest.json`에 등록합니다.

```json
{
  "aws":   { "vm": "aws/ec2.svg", "db": "aws/rds.svg", "lb": "aws/elb.svg" },
  "gcp":   { "vm": "gcp/compute-engine.svg", "db": "gcp/cloud-sql.svg" },
  "azure": { "vm": "azure/virtual-machine.svg", "db": "azure/mysql.svg" }
}
```

파일 이름은 받은 그대로 써도 됩니다. 경로만 맞으면 됩니다.

| 키 | 도면 위치 |
| --- | --- |
| users | 사용자 |
| dns | DNS |
| edge | CDN·WAF |
| lb | 로드밸런서 |
| nat | NAT |
| vm | 앱 서버 |
| db | DB |
| obj | 오브젝트 스토리지 |
| cache | 캐시 |
| secret | 시크릿 |
| mon | 모니터링 |
| net, sub, fw, pin | 매핑표 행 (네트워크, 서브넷, 방화벽, 리전) |

`python3 tools/check.py`가 등록한 경로에 파일이 있는지 확인합니다.
