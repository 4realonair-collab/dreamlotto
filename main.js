// Cloudflare Pages Function 프록시 경로
const PROXY_URL = '/api/gemini';

// 상태 변수
let isInterpreted = false;
let firstAdCompleted = false;
let secondAdCompleted = false;
let lottoSets = []; // AI가 생성한 로또 5세트 저장

// DOM 요소
const dreamInput = document.getElementById('dream-input');
const interpretBtn = document.getElementById('interpret-btn');
const resultSection = document.getElementById('result-section');
const easternResult = document.getElementById('eastern-result');
const westernResult = document.getElementById('western-result');
const firstLottoBtn = document.getElementById('first-lotto-btn');
const adSection = document.getElementById('ad-section');
const adProgress = document.getElementById('ad-progress');
const firstLottoSection = document.getElementById('first-lotto-section');
const firstLottoNumbers = document.getElementById('first-lotto-numbers');
const secondLottoBtn = document.getElementById('second-lotto-btn');
const secondLottoSection = document.getElementById('second-lotto-section');
const secondLottoNumbers = document.getElementById('second-lotto-numbers');
const loading = document.getElementById('loading');

// ============================================
// 광고 Mock 함수
// 나중에 실제 Google AdSense 코드로 교체하세요
// ============================================
function showAd(callback) {
  // 광고 섹션 표시
  adSection.classList.remove('hidden');
  adProgress.style.width = '0%';

  // 3초 동안 프로그레스 바 애니메이션
  let progress = 0;
  const interval = setInterval(() => {
    progress += 2;
    adProgress.style.width = `${progress}%`;

    if (progress >= 100) {
      clearInterval(interval);
      adSection.classList.add('hidden');

      // ============================================
      // TODO: 여기에 실제 AdSense 광고 코드 삽입
      // 예시:
      // if (typeof adsbygoogle !== 'undefined') {
      //   (adsbygoogle = window.adsbygoogle || []).push({});
      // }
      // ============================================

      // 콜백 실행 (다음 단계로 진행)
      if (callback) callback();
    }
  }, 60); // 3초 = 3000ms / 50 steps = 60ms per step
}

// 해몽하기 버튼 클릭
interpretBtn.addEventListener('click', async () => {
  const dreamText = dreamInput.value.trim();

  if (!dreamText) {
    alert('꿈 내용을 입력해주세요.');
    return;
  }

  if (dreamText.length < 10) {
    alert('꿈 내용을 좀 더 자세히 적어주세요. (최소 10자)');
    return;
  }

  // 상태 초기화
  isInterpreted = false;
  firstAdCompleted = false;
  secondAdCompleted = false;
  lottoSets = [];

  // UI 초기화
  interpretBtn.disabled = true;
  loading.classList.remove('hidden');
  resultSection.classList.add('hidden');
  firstLottoBtn.classList.add('hidden');
  firstLottoSection.classList.add('hidden');
  secondLottoBtn.classList.add('hidden');
  secondLottoSection.classList.add('hidden');

  try {
    const result = await getDreamInterpretation(dreamText);

    // 결과 파싱
    parseResults(result);

    // 1단계: 해몽 결과만 표시
    resultSection.classList.remove('hidden');
    isInterpreted = true;

    // 2단계: 첫 번째 로또 버튼 표시
    firstLottoBtn.classList.remove('hidden');

  } catch (error) {
    console.error('해몽 오류:', error);
    // 디버깅용 상세 에러 메시지 (원인 파악 후 제거)
    alert('[디버그] 오류: ' + (error.message || error.toString()) + '\n\n타입: ' + error.name);
  } finally {
    interpretBtn.disabled = false;
    loading.classList.add('hidden');
  }
});

// 첫 번째 로또 버튼 클릭 (3세트 받기)
firstLottoBtn.addEventListener('click', () => {
  if (!isInterpreted) return;

  firstLottoBtn.disabled = true;

  // 3단계: 광고 시뮬레이션 후 3세트 공개
  showAd(() => {
    firstAdCompleted = true;
    displayLottoSets(firstLottoNumbers, lottoSets.slice(0, 3));
    firstLottoSection.classList.remove('hidden');
    firstLottoBtn.classList.add('hidden');

    // 4단계: 두 번째 로또 버튼 표시
    secondLottoBtn.classList.remove('hidden');
  });
});

// 두 번째 로또 버튼 클릭 (추가 2세트 받기)
secondLottoBtn.addEventListener('click', () => {
  if (!firstAdCompleted) return;

  secondLottoBtn.disabled = true;

  // 5단계: 광고 시뮬레이션 후 나머지 2세트 공개
  showAd(() => {
    secondAdCompleted = true;
    displayLottoSets(secondLottoNumbers, lottoSets.slice(3, 5));
    secondLottoSection.classList.remove('hidden');
    secondLottoBtn.classList.add('hidden');
  });
});

// Gemini API로 해몽 및 로또 번호 요청
async function getDreamInterpretation(dreamText) {
  const prompt = `너는 20년 경력의 전문 해몽가야. 사용자가 꿈 내용을 입력하면 **[동양적 관점]**과 **[서양적 관점]**으로 나누어 각각 300자 정도로 간략히 설명해 줘. 마지막에는 그 꿈의 기운과 어울리는 **로또 번호 5세트(각 6개 숫자, 1-45 범위)**를 생성해 줘.

꿈 내용: "${dreamText}"

다음 형식으로 정확히 응답해줘:

[동양적 관점]
(동양 해몽 내용)

[서양적 관점]
(서양 해몽 내용)

[로또 번호]
1세트: 1, 2, 3, 4, 5, 6
2세트: 7, 8, 9, 10, 11, 12
3세트: 13, 14, 15, 16, 17, 18
4세트: 19, 20, 21, 22, 23, 24
5세트: 25, 26, 27, 28, 29, 30`;

  const response = await fetch(PROXY_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: 0.9,
        maxOutputTokens: 2048,
      }
    })
  });

  const data = await response.json();

  if (!response.ok) {
    // API 에러 상세 메시지 확인
    var errorMsg = 'API 요청 실패: ' + response.status;
    if (data && data.error && data.error.message) {
      errorMsg += ' - ' + data.error.message;
    } else if (data) {
      errorMsg += ' - ' + JSON.stringify(data).substring(0, 200);
    }
    throw new Error(errorMsg);
  }

  if (data.candidates &&
      data.candidates[0] &&
      data.candidates[0].content &&
      data.candidates[0].content.parts &&
      data.candidates[0].content.parts[0] &&
      data.candidates[0].content.parts[0].text) {
    return data.candidates[0].content.parts[0].text;
  }

  throw new Error('응답 파싱 실패');
}

// 결과 파싱
function parseResults(text) {
  // 동양적 관점 추출
  const easternMatch = text.match(/\[동양적 관점\]\s*([\s\S]*?)(?=\[서양적 관점\])/);
  const easternText = easternMatch ? easternMatch[1].trim() : '해석을 불러올 수 없습니다.';

  // 서양적 관점 추출
  const westernMatch = text.match(/\[서양적 관점\]\s*([\s\S]*?)(?=\[로또 번호\])/);
  const westernText = westernMatch ? westernMatch[1].trim() : '해석을 불러올 수 없습니다.';

  // 로또 번호 추출
  const lottoMatch = text.match(/\[로또 번호\]\s*([\s\S]*?)$/);
  const lottoText = lottoMatch ? lottoMatch[1].trim() : '';

  // 해몽 결과 표시
  easternResult.innerHTML = formatInterpretation(easternText);
  westernResult.innerHTML = formatInterpretation(westernText);

  // 로또 번호 파싱 및 저장
  parseLottoNumbers(lottoText);
}

// 해몽 텍스트 포맷팅
function formatInterpretation(text) {
  return text
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>')
    .replace(/^/, '<p>')
    .replace(/$/, '</p>');
}

// 로또 번호 파싱
function parseLottoNumbers(lottoText) {
  lottoSets = [];
  const setRegex = /(\d)세트[:\s]*([\d,\s]+)/g;
  var match;

  while ((match = setRegex.exec(lottoText)) !== null) {
    var numbersStr = match[2];
    var numbersMatch = numbersStr.match(/\d+/g);
    var numbers = numbersMatch ? numbersMatch.map(function(n) { return parseInt(n, 10); }).slice(0, 6) : [];

    if (numbers.length === 6) {
      lottoSets.push(numbers.sort(function(a, b) { return a - b; }));
    }
  }

  // 5세트가 안 되면 랜덤으로 채우기
  while (lottoSets.length < 5) {
    lottoSets.push(generateRandomLottoSet());
  }
}

// 랜덤 로또 번호 생성 (백업용)
function generateRandomLottoSet() {
  const numbers = [];
  while (numbers.length < 6) {
    const num = Math.floor(Math.random() * 45) + 1;
    if (!numbers.includes(num)) {
      numbers.push(num);
    }
  }
  return numbers.sort((a, b) => a - b);
}

// 번호에 따른 공 색상 결정 (실제 로또 공 색상)
function getBallColor(num) {
  if (num <= 10) return 'ball-yellow';
  if (num <= 20) return 'ball-blue';
  if (num <= 30) return 'ball-red';
  if (num <= 40) return 'ball-gray';
  return 'ball-green';
}

// 로또 세트 표시
function displayLottoSets(container, sets) {
  container.innerHTML = '';

  sets.forEach((numbers, index) => {
    const setDiv = document.createElement('div');
    setDiv.className = 'lotto-set';
    setDiv.style.animationDelay = `${index * 0.2}s`;

    const setLabel = document.createElement('span');
    setLabel.className = 'set-label';
    setLabel.textContent = `${lottoSets.indexOf(numbers) + 1}세트`;
    setDiv.appendChild(setLabel);

    const ballsDiv = document.createElement('div');
    ballsDiv.className = 'lotto-balls';

    numbers.forEach((num, ballIndex) => {
      const ball = document.createElement('div');
      ball.className = `lotto-ball ${getBallColor(num)}`;
      ball.textContent = num;
      ball.style.animationDelay = `${index * 0.2 + ballIndex * 0.1}s`;
      ballsDiv.appendChild(ball);
    });

    setDiv.appendChild(ballsDiv);
    container.appendChild(setDiv);
  });
}
